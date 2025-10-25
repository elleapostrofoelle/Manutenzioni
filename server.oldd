// server.ts
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

console.log('Server Node.js avviato!');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Node.js server!');
});

// Esporta l'applicazione Express per essere utilizzata da altri moduli
export default app;