require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiModels() {
  try {
    console.log('Testing Gemini models...');
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Test different model names
    const modelsToTest = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-pro',
      'models/gemini-pro'
    ];
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`\n🧪 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "Hello" in a friendly way');
        const response = result.response.text();
        console.log(`✅ ${modelName} works! Response: ${response.substring(0, 100)}...`);
        break; // Use the first working model
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Gemini test failed:', error.message);
  }
}

testGeminiModels();
