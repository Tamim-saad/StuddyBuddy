require('dotenv').config();
const { OpenAI } = require('openai');

let openai = null;

try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy') {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    console.warn('OpenAI API key not configured. OpenAI features will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error.message);
}

module.exports = openai;
