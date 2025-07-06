require('dotenv').config();
const gemini = require('./config/geminiClient');

async function testGeminiClient() {
  try {
    console.log('Testing Gemini client...');
    
    if (!gemini) {
      console.error('❌ Gemini client is null - check API key configuration');
      return;
    }

    const result = await gemini.generateContent('Say hello in a friendly way');
    const response = result.response.text();
    
    console.log('✅ Gemini client working! Response:', response);
  } catch (error) {
    console.error('❌ Gemini client test failed:', error.message);
    console.error('Full error:', error);
  }
}

testGeminiClient();
