const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const { pipeline } = require('@xenova/transformers');
const fetch = require('node-fetch'); 
const openai = require('../config/openaiClient');

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

    const mcqs = JSON.parse(response);
    if (!Array.isArray(mcqs)) {
      throw new Error('Generated content is not a valid array');
    }

    return {
      questions: mcqs,
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

    const cqs = JSON.parse(response);
    if (!Array.isArray(cqs)) {
      throw new Error('Generated content is not a valid array');
    }

    return {
      questions: cqs,
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
    const parsedResponse = JSON.parse(response);
    
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