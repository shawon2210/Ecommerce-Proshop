// Middleware to handle 404 errors (Not Found)
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Middleware to handle errors
const errorHandler = (err, req, res, next) => {
  // Set status code (use error's statusCode or 500 if not defined)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Handle specific MongoDB errors
  if (err.name === 'CastError') {
    statusCode = 404;
    err.message = 'Resource not found';
  }
  
  if (err.code === 11000) {
    statusCode = 400;
    err.message = 'Duplicate field value entered';
  }
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    err.message = Object.values(err.errors).map(val => val.message).join(', ');
  }
  
  console.error('Error:', err.message);
  
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };