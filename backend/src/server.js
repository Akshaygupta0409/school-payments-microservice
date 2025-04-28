import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
// Handle EADDRINUSE (port in use) errors
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use`);
    process.exit(1);
  }
});
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
