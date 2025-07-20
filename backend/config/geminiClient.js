require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

let gemini = null;

try {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy' && process.env.GEMINI_API_KEY !== 'test-key') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use Gemini 1.5 Flash model (correct model name for current API)
    gemini = genAI.getGenerativeModel({ 
      model: "models/gemini-1.5-flash",
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1024,
        topK: 40,
        topP: 0.95,
      }
    });
    
    console.log('✅ Gemini client initialized successfully');
  } else {
    console.warn('⚠️ Gemini API key not configured or is dummy/test key. AI features will be disabled.');
    gemini = null;
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini client:', error.message);
  gemini = null;
}

module.exports = gemini;
