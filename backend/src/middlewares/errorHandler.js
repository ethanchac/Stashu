export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    return res.status(403).json({
      error: 'Authentication error',
      message: err.message
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};
