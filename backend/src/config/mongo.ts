import { MongoClient, Collection } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'ragdb';

const client = new MongoClient(uri);
let connected = false;

export interface DocumentEmbeddingDoc {
    file_id: string;
    file_name: string;
    chunk_index: number;
    text: string;
    embedding: number[];
    metadata: Record<string, unknown>;
    created_at: Date;
}

export async function getEmbeddingsCollection(): Promise<Collection<DocumentEmbeddingDoc>> {
    if (!connected) {
        await client.connect();
        connected = true;
        console.log('Connected to MongoDB Atlas.');
    }
    return client.db(dbName).collection<DocumentEmbeddingDoc>('document_embeddings');
}
