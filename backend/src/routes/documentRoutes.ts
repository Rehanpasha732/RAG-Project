import express from 'express';
import upload from '../middleware/upload';
import { authenticate } from '../middleware/auth.middleware';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument
} from '../controllers/documentController';

const router = express.Router();

router.use(authenticate);

// List all documents for the authenticated user
router.get('/', listDocuments);

// Upload document + extract text + generate embeddings
router.post('/upload', upload.single('document'), uploadDocument);

// Get / rename / delete a document by ID
router.get('/:id', getDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;
