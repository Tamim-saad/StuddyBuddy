// Debug script to check service availability
require('dotenv').config();

const { Pool } = require('pg');
const gemini = require('./config/geminiClient');

async function checkServices() {
  console.log('🔍 Checking service availability...\n');

  // Check Gemini API
  console.log('1. Gemini AI Service:');
  if (gemini) {
    try {
      const result = await gemini.generateContent('Hello, this is a test.');
      console.log('   ✅ Gemini API is working');
      console.log('   📝 Test response:', result.response.text().substring(0, 100) + '...\n');
    } catch (error) {
      console.log('   ❌ Gemini API error:', error.message);
    }
  } else {
    console.log('   ❌ Gemini client not initialized');
    console.log('   📋 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set' : 'Not set');
  }

  // Check PostgreSQL
  console.log('2. PostgreSQL Database:');
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URI
  });

  try {
    const result = await pool.query('SELECT NOW()');
    console.log('   ✅ PostgreSQL is connected');
    console.log('   📅 Current time:', result.rows[0].now);
  } catch (error) {
    console.log('   ❌ PostgreSQL error:', error.message);
  } finally {
    await pool.end();
  }

  // Check Qdrant
  console.log('\n3. Qdrant Vector Database:');
  try {
    const { client } = require('./utils/qdrantClient');
    if (client) {
      const info = await client.getCollections();
      console.log('   ✅ Qdrant is connected');
      console.log('   📊 Collections:', info.collections.map(c => c.name));
    } else {
      console.log('   ❌ Qdrant client not available');
    }
  } catch (error) {
    console.log('   ❌ Qdrant error:', error.message);
  }

  console.log('\n✨ Service check complete!');
}

checkServices().catch(console.error);