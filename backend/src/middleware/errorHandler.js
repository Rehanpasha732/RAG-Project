const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.message && err.message.startsWith('Unsupported file type')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large. Maximum size is 10MB.'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};

module.exports = { errorHandler };
