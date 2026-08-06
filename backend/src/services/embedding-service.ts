import ollama from 'ollama';

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await ollama.embed({
      model: 'nomic-embed-text',
      input: text
    });

    return response.embeddings[0];

  } catch (error) {
    console.log('Embedding Error:', error);
    throw error;
  }
}
