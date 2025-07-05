const { QdrantClient } = require("@qdrant/js-client-rest");
const { v4: uuidv4 } = require('uuid');
const backOff = require('exponential-backoff');

const client = new QdrantClient({ 
  url: process.env.QDRANT_URL || "http://localhost:6333",
  timeout: 10000, // 10 second timeout
  retry: 3 // Retry 3 times
});

const COLLECTION_NAME = "document_chunks";

const initializeCollection = async () => {
  try {
    // Check if collection exists
    const collections = await client.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

    if (!exists) {
      // Create collection only if it doesn't exist
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 384,
          distance: "Cosine"
        }
      });
      console.log(`Created new collection: ${COLLECTION_NAME}`);
    } else {
      console.log(`Collection ${COLLECTION_NAME} already exists`);
    }

    // Create payload index regardless
    try {
      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: "file_id",
        field_schema: "integer",
        wait_for_completion: true
      });
    } catch (indexError) {
      // Ignore if index already exists
      console.log('Payload index setup completed');
    }

  } catch (error) {
    console.error("Qdrant initialization error:", error);
    throw error;
  }
};

// Store document chunks with embeddings
const storeDocumentChunks = async (fileId, chunks) => {
  try {
    console.log(`Storing ${chunks.length} chunks for file ${fileId}`);
    
    // Split chunks into smaller batches
    const BATCH_SIZE = 100;
    const batches = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      batches.push(chunks.slice(i, i + BATCH_SIZE));
    }

    let totalStored = 0;
    
    // Process batches with retry logic
    for (const batch of batches) {
      const points = batch.map((chunk, index) => ({
        id: uuidv4(),
        vector: chunk.embedding,
        payload: {
          file_id: parseInt(fileId),
          text: chunk.text,
          chunk_index: totalStored + index
        }
      }));

      await backOff.backOff(async () => {
        console.log(`Upserting batch of ${points.length} points...`);
        await client.upsert(COLLECTION_NAME, {
          wait: true,
          points
        });
        totalStored += points.length;
      }, {
        numOfAttempts: 3,
        startingDelay: 1000,
        timeMultiple: 2,
        maxDelay: 5000
      });
    }

    console.log(`Successfully stored ${totalStored} points`);
    return totalStored;

  } catch (error) {
    console.error("Qdrant storage error:", error);
    throw error;
  }
};

// Search similar chunks
const searchSimilarChunks = async (queryVector, limit = 5, fileId = null) => {
  try {
    const filter = fileId ? {
      must: [
        {
          key: "file_id",
          match: { value: fileId }
        }
      ]
    } : undefined;

    const results = await client.search(COLLECTION_NAME, {
      vector: queryVector,
      limit,
      filter
    });

    return results;
  } catch (error) {
    console.error("Qdrant search error:", error);
    throw error;
  }
};

module.exports = {
  client,
  initializeCollection,
  storeDocumentChunks,
  searchSimilarChunks
};