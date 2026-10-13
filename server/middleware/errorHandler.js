module.exports = (err, req, res, next) => {
  console.error('\n========== ERROR ==========');
  console.error('Path:', req.method, req.originalUrl);
  console.error('Message:', err.message);
  console.error('Code:', err.code);
  console.error('SQL:', err.sql);
  console.error('Stack:', err.stack);
  console.error('============================\n');
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected error occurred.',
    code: err.code || null
  });
};