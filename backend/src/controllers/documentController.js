const path = require('path');
const fs = require('fs');
const { extractText } = require('../utils/textExtractor');

/**
 * POST /api/documents/upload
 * Upload a document, extract text, return the result
 */
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.file;
    const filePath = file.path;
    const mimetype = file.mimetype;

    console.log(`📄 Processing: ${file.originalname} (${mimetype})`);

    // Extract text
    const extracted = await extractText(filePath, mimetype);

    // Build response
    const result = {
      success: true,
      document: {
        id: path.basename(file.filename, path.extname(file.filename)),
        originalName: file.originalname,
        fileName: file.filename,
        mimetype,
        size: file.size,
        sizeFormatted: formatBytes(file.size),
        uploadedAt: new Date().toISOString()
      },
      extracted: {
        text: extracted.text,
        textLength: extracted.text.length,
        pages: extracted.pages,
        metadata: extracted.metadata
      }
    };

    console.log(`✅ Extracted ${extracted.text.length} chars, ~${extracted.pages} pages`);

    res.json(result);

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/:id
 * Get previously extracted document details
 */
const getDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');

    // Find file starting with this id
    const files = fs.readdirSync(uploadDir)
      .filter(f => f.startsWith(id));

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const filePath = path.join(uploadDir, files[0]);
    const stats = fs.statSync(filePath);

    res.json({
      success: true,
      document: {
        id,
        fileName: files[0],
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        uploadedAt: stats.birthtime.toISOString()
      }
    });

  } catch (err) {
    next(err);
  }
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = { uploadDocument, getDocument };
