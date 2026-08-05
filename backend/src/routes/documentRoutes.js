const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadDocument, getDocument } = require('../controllers/documentController');

// Upload document + extract text
router.post('/upload', upload.single('document'), uploadDocument);

// Get document by ID
router.get('/:id', getDocument);

module.exports = router;
