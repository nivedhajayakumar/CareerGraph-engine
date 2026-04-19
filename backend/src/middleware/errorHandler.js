export const errorHandler = (err, req, res, next) => {
  // log the full stack trace in your terminal for debugging
  console.error(err.stack)

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(statusCode).json({
    success: false,
    error: message
  })
}