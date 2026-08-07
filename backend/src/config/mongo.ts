import { MongoClient, Collection, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'ragdb';

const client = new MongoClient(uri);
let connected = false;

export interface DocumentEmbeddingDoc {
    file_id: string;
    user_id: string;
    file_name: string;
    chunk_index: number;
    text: string;
    embedding: number[];
    metadata: Record<string, unknown>;
    created_at: Date;
}

export interface DocumentRecord {
    file_id: string;
    user_id: string;
    original_name: string;
    file_name: string;
    mimetype: string;
    size: number;
    size_formatted: string;
    pages: number;
    text_length: number;
    uploaded_at: Date;
    status?: 'processing' | 'ready' | 'failed';
    error?: string;
}

export interface UserRecord {
    name: string;
    email: string;
    password: string;
    created_at: Date;
    role?: 'user' | 'admin';
    disabled?: boolean;
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    text: string;
    sources?: { file_name: string; score: number }[];
    created_at: Date;
}

export interface ConversationDoc {
    _id?: ObjectId;
    user_id: string;
    title: string;
    created_at: Date;
    updated_at: Date;
    messages: ConversationMessage[];
}

async function ensureConnected() {
    if (!connected) {
        await client.connect();
        connected = true;
        console.log('Connected to MongoDB Atlas.');
    }
}

export async function getEmbeddingsCollection(): Promise<Collection<DocumentEmbeddingDoc>> {
    await ensureConnected();
    return client.db(dbName).collection<DocumentEmbeddingDoc>('document_embeddings');
}

export async function getDocumentsCollection(): Promise<Collection<DocumentRecord>> {
    await ensureConnected();
    return client.db(dbName).collection<DocumentRecord>('documents');
}

export async function getUsersCollection(): Promise<Collection<UserRecord>> {
    await ensureConnected();
    const collection = client.db(dbName).collection<UserRecord>('users');
    await collection.createIndex({ email: 1 }, { unique: true });
    return collection;
}

export async function getConversationsCollection(): Promise<Collection<ConversationDoc>> {
    await ensureConnected();
    const collection = client.db(dbName).collection<ConversationDoc>('conversations');
    await collection.createIndex({ user_id: 1, updated_at: -1 });
    return collection;
}
