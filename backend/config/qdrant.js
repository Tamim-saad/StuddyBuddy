const { QdrantClient } = require('@qdrant/js-client-rest');

// Qdrant client configuration
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY || undefined, // Optional for local development
});

// Initialize Qdrant collections
const initializeQdrant = async () => {
  try {
    console.log('🔄 Initializing Qdrant vector database...');
    
    // Check if collections exist, create if not
    const collections = ['documents', 'notes', 'flashcards'];
    
    for (const collectionName of collections) {
      try {
        await qdrantClient.getCollection(collectionName);
        console.log(`✅ Collection '${collectionName}' already exists`);
      } catch (error) {
        if (error.status === 404) {
          // Collection doesn't exist, create it
          await qdrantClient.createCollection(collectionName, {
            vectors: {
              size: 1536, // OpenAI embedding size
              distance: 'Cosine',
            },
          });
          console.log(`✅ Created collection '${collectionName}'`);
        } else {
          console.error(`❌ Error checking collection '${collectionName}':`, error);
        }
      }
    }
    
    console.log('🎉 Qdrant initialization completed');
  } catch (error) {
    console.error('❌ Failed to initialize Qdrant:', error);
    throw error;
  }
};

// Health check function
const checkQdrantHealth = async () => {
  try {
    const health = await qdrantClient.api('cluster').clusterStatus();
    return health;
  } catch (error) {
    console.error('Qdrant health check failed:', error);
    return null;
  }
};

module.exports = {
  qdrantClient,
  initializeQdrant,
  checkQdrantHealth,
};
