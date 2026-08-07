import express from 'express';
import upload from '../../middleware/upload';
import { authenticate } from '../../middleware/auth.middleware';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  embedQuery,
  askQuestion
} from '../../controllers/user/documentController';

const router = express.Router();

router.use(authenticate);

// List all documents for the authenticated user
router.get('/', listDocuments);

// Upload document + extract text + generate embeddings
router.post('/upload', upload.single('document'), uploadDocument);

// Embed a user query using the same Ollama model (first step of retrieval)
router.post('/query-embedding', embedQuery);

// Full RAG: retrieve relevant chunks + ask the LLM to answer using them
router.post('/ask', askQuestion);

// Get / rename / delete a document by ID
router.get('/:id', getDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;
