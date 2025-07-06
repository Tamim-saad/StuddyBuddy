const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const { pipeline } = require('@xenova/transformers');
const fetch = require('node-fetch'); 

// Initialize OpenAI client with better Docker environment support
let openai = null;
try {
  // Re-import openai client to ensure it picks up environment variables
  const openaiClient = require('../config/openaiClient');
  openai = openaiClient;
  
  // Log OpenAI status for debugging
  if (openai) {
    console.log('✅ OpenAI client initialized successfully');
  } else {
    console.warn('⚠️ OpenAI client not available - API key may be missing');
  }
} catch (error) {
  console.error('❌ Failed to initialize OpenAI client:', error.message);
}

// Helper function to parse JSON response from OpenAI
const parseJSONResponse = (response) => {
  console.log('Attempting to parse OpenAI response:', response);
  
  try {
    // First try to parse as-is
    return JSON.parse(response);
  } catch (error) {
    console.log('Direct JSON parse failed, trying to clean response...');
    
    // If that fails, try to extract JSON from markdown code blocks
    try {
      // Remove markdown code block markers
      let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Remove any leading/trailing whitespace
      cleaned = cleaned.trim();
      
      // Try to find JSON-like content between curly braces (for objects)
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('Found JSON object, attempting to parse...');
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no curly braces found, try to find array content
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        console.log('Found JSON array, attempting to parse...');
        return JSON.parse(arrayMatch[0]);
      }
      
      // Remove any non-JSON text before the actual JSON
      const lines = cleaned.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('{') || line.startsWith('[')) {
          const remainingText = lines.slice(i).join('\n');
          console.log('Found JSON starting line, attempting to parse...');
          return JSON.parse(remainingText);
        }
      }
      
      // If all else fails, try to parse the cleaned string
      console.log('Attempting to parse cleaned string as last resort...');
      return JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse JSON response after all attempts:', response);
      console.error('Parse error:', parseError);
      throw new Error(`Invalid JSON response: ${response.substring(0, 200)}...`);
    }
  }
};

// Initialize Gemini API with proper error handling
const initializeGeminiAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found in environment variables');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// Create model instance with retry mechanism
const createModel = () => {
  try {
    const genAI = initializeGeminiAI();
    return genAI.getGenerativeModel({ 
      model: "gemini-pro",
      safety_settings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    });
  } catch (error) {
    console.error('Failed to initialize Gemini model:', error);
    throw error;
  }
};

const model = createModel();

// Initialize embedding model
let embedder = null;
const initializeEmbedder = async () => {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
};

// Function to generate embeddings using Transformer model
const generateEmbeddings = async (text) => {
  try {
    const model = await initializeEmbedder();
    const output = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
};

// Function to generate MCQ questions using Gemini with retries
const generateMCQs = async (text, options = {}) => {
  const {
    questionCount = 5,
    title = 'Untitled Quiz',
    priority = 0,
    file_id,
  } = options;

  try {
    // Validate text input
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    // Check if OpenAI client is available
    if (!openai) {
      throw new Error('OpenAI client not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    const prompt = `
Generate ${questionCount} multiple choice questions based on the following text.
Each question should test understanding of key concepts.

Format your response as a valid JSON array in this exact structure:
[
  {
    "question": "What is...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correctAnswer": "A) ...",
    "explanation": "This is correct because..."
  }
]

Text to generate questions from:
${text.substring(0, 3000)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content.trim();
    console.log('Raw OpenAI response:', response);

    const mcqs = parseJSONResponse(response);
    console.log('Parsed MCQs:', JSON.stringify(mcqs, null, 2));
    
    if (!Array.isArray(mcqs)) {
      console.error('Generated content is not a valid array:', mcqs);
      throw new Error('Generated content is not a valid array');
    }

    // Validate each MCQ has required fields
    const validatedMCQs = mcqs.map((mcq, index) => {
      if (!mcq.question || !mcq.options || !mcq.correctAnswer) {
        console.error(`Invalid MCQ at index ${index}:`, mcq);
        throw new Error(`Invalid MCQ structure at index ${index}`);
      }
      return {
        question: String(mcq.question),
        options: Array.isArray(mcq.options) ? mcq.options.map(opt => String(opt)) : [],
        correctAnswer: String(mcq.correctAnswer),
        explanation: String(mcq.explanation || '')
      };
    });

    return {
      questions: validatedMCQs,
      file_id,
      title,
      priority,
      type: 'mcq',
    };
  } catch (error) {
    console.error('MCQ generation error:', error);
    throw error;
  }
};
const generateCQs = async (text, options = {}) => {
  const {
    questionCount = 5,
    title = 'Untitled Quiz',
    priority = 0,
    file_id,
  } = options;

  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    // Check if OpenAI client is available
    if (!openai) {
      throw new Error('OpenAI client not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    const prompt = `
Generate ${questionCount} creative questions based on the following text.
Each question should test deep understanding of concepts.

Format your response as a valid JSON array in this exact structure:
[
  {
    "question": "What is...",
    "modelAnswer": "Detailed explanation of the answer...",
    "rubric": {
      "keyPoints": ["Key concept 1", "Key concept 2", "Key concept 3"],
      "maxScore": 10
    }
  }
]

Text to generate questions from:
${text.substring(0, 3000)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content.trim();
    console.log('Raw OpenAI response:', response);

    const cqs = parseJSONResponse(response);
    console.log('Parsed CQs:', JSON.stringify(cqs, null, 2));
    
    if (!Array.isArray(cqs)) {
      console.error('Generated content is not a valid array:', cqs);
      throw new Error('Generated content is not a valid array');
    }

    // Validate each CQ has required fields
    const validatedCQs = cqs.map((cq, index) => {
      if (!cq.question || !cq.modelAnswer) {
        console.error(`Invalid CQ at index ${index}:`, cq);
        throw new Error(`Invalid CQ structure at index ${index}`);
      }
      return {
        question: String(cq.question),
        modelAnswer: String(cq.modelAnswer),
        rubric: {
          keyPoints: Array.isArray(cq.rubric?.keyPoints) ? cq.rubric.keyPoints.map(kp => String(kp)) : [],
          maxScore: Number(cq.rubric?.maxScore) || 10
        }
      };
    });

    return {
      questions: validatedCQs,
      file_id,
      title,
      priority,
      type: 'cq',
    };

  } catch (error) {
    console.error('CQ generation error:', error);
    throw error;
  }
};

const generateStickyNotes = async (text, options = {}) => {
  const {
    noteCount = 5,
    title = 'Untitled Notes',
    file_id,
  } = options;

  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    const prompt = `
Generate ${noteCount} flashcards/sticky notes based on the following text.
Also suggest a concise but descriptive title for this set of notes (max 200 characters).
Each note should capture key concepts, definitions, or important points.

Format your response as a valid JSON object in this exact structure:
{
  "title": "A descriptive title for these notes",
  "notes": [
    {
      "front": "Key term or concept",
      "back": "Definition or explanation",
      "tags": ["relevant", "topic", "tags"],
      "importance": "high/medium/low"
    }
  ]
}

Text to generate notes from:
${text.substring(0, 3000)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content.trim();
    const parsedResponse = parseJSONResponse(response);
    
    if (!parsedResponse.notes || !Array.isArray(parsedResponse.notes)) {
      throw new Error('Generated content is not in the correct format');
    }

    return {
      title: parsedResponse.title || title,
      notes: parsedResponse.notes,
      file_id
    };

  } catch (error) {
    console.error('Sticky notes generation error:', error);
    throw error;
  }
};

module.exports = {
  model,
  generateEmbeddings,
  generateMCQs,
  generateCQs,
  generateStickyNotes
};