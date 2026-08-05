async function chunkText(text) {
    const { RecursiveCharacterTextSplitter } = await import("@langchain/textsplitters");

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 50,
    });

    const docs = await splitter.createDocuments([text]);

    return docs.map((doc, index) => ({
        id: index + 1,
        text: doc.pageContent,
        metadata: doc.metadata,
    }));
}

module.exports = { chunkText };