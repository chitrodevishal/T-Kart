import dotenv from 'dotenv';

// Load environment variables from .env file before anything else
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;

// Start Express HTTP Server
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  T-Kart REST API Server is Active       `);
  console.log(`  URL: http://localhost:${PORT}          `);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=========================================`);
});

// Handle unhandled Promise rejections (e.g., database connection issues in Phase 2)
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down gracefully...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});
