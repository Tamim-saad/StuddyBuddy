const openai = require('../config/openaiClient');

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

    // Check if OpenAI client is available
    if (!openai) {
      throw new Error('OpenAI client not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    const prompt = `
Generate ${noteCount} concise flashcards/sticky notes based on the following text.
Also suggest a concise but descriptive title for this set of notes (max 100 characters).
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
${text.substring(0, 2000)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-mini", // Using mini version for cost efficiency
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5, // Reduced temperature for more consistent results
      max_tokens: 500, // Limit tokens to control costs
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
  generateStickyNotes
};