import express from 'express';
import upload from '../middleware/upload';
import { uploadDocument, getDocument } from '../controllers/documentController';

const router = express.Router();

// Upload document + extract text
router.post('/upload', upload.single('document'), uploadDocument);

// Get document by ID
router.get('/:id', getDocument);

export default router;
