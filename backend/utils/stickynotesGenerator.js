const gemini = require('../config/geminiClient');

const generateStickyNotes = async (text, options = {}) => {
  const {
    noteCount = 3, // Reduced from 5 to 3 for cost efficiency
    title = 'Untitled Notes',
    file_id,
  } = options;

  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    // Check if Gemini client is available
    if (!gemini) {
      throw new Error('Gemini client not configured. Please set GEMINI_API_KEY in environment variables.');
    }

    const prompt = `
Generate ${noteCount} concise flashcards/sticky notes based on the following text.
Also suggest a concise but descriptive title for this set of notes (max 100 characters).
Each note should capture key concepts, definitions, or important points.

IMPORTANT: Return ONLY a valid JSON object without any markdown formatting or code blocks.
Do not wrap the response in triple backticks with json or any other formatting.

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
${text.substring(0, 2000)}
    `;

    const result = await gemini.generateContent(prompt);
    const response = result.response.text().trim();
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
  generateStickyNotes
};