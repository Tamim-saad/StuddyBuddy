const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const generateMCQs = async (text, questionCount = 5) => {
  try {
    const prompt = `
    Generate ${questionCount} multiple choice questions based on this text. 
    Format your response as a JSON array of objects with this structure:
    {
      "question": "the question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": "the correct option",
      "explanation": "brief explanation why this is correct"
    }

    Text: ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    
    try {
      const mcqs = JSON.parse(response);
      return mcqs;
    } catch (parseError) {
      console.error('Failed to parse MCQ response:', parseError);
      throw new Error('Invalid MCQ format generated');
    }
  } catch (error) {
    console.error('MCQ generation error:', error);
    throw error;
  }
};

const generateCQs = async (text, questionCount = 5) => {
  try {
    const prompt = `
    Generate ${questionCount} creative questions based on this text.
    Format your response as a JSON array of objects with this structure:
    {
      "question": "the question text",
      "modelAnswer": "detailed model answer",
      "rubric": {
        "keyPoints": ["point 1", "point 2", "point 3"],
        "maxScore": 10
      }
    }

    Text: ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();
    
    try {
      const cqs = JSON.parse(response);
      return cqs;
    } catch (parseError) {
      console.error('Failed to parse CQ response:', parseError);
      throw new Error('Invalid CQ format generated');
    }
  } catch (error) {
    console.error('CQ generation error:', error);
    throw error;
  }
};

module.exports = {
  generateMCQs,
  generateCQs
};