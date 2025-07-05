require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use v1 model name
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

(async () => {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: "Say hello in three languages." }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 256,
      },
    });

    const text = await result.response.text();
    console.log("✅ Gemini Output:", text);
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
  }
})();
