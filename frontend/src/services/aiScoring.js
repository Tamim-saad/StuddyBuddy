export const getAIScore = async (answer, modelAnswer, rubric) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/quiz/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentAnswer: answer,
        modelAnswer: modelAnswer,
        rubric: rubric
      })
    });

    if (!response.ok) {
      throw new Error('Evaluation failed');
    }

    const data = await response.json();
    return data.score;
  } catch (error) {
    console.error('AI scoring error:', error);
    return null;
  }
};