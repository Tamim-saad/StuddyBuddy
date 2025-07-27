const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

const client = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: process.env.QDRANT_PORT || 6333,
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

module.exports = { client };
