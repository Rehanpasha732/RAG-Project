export interface TextChunk {
  id: number;
  text: string;
  metadata: Record<string, unknown>;
}

async function chunkText(text: string): Promise<TextChunk[]> {
  const { RecursiveCharacterTextSplitter } = await import('@langchain/textsplitters');

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 700,
    chunkOverlap: 100,
  });

  const docs = await splitter.createDocuments([text]);

  return docs.map((doc, index) => ({
    id: index + 1,
    text: doc.pageContent,
    metadata: doc.metadata,
  }));
}

export { chunkText };
