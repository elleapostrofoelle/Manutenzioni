// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import the compiled server app
import app from './dist/backend/server.js'; // Percorso corretto per il modulo compilato

const port = process.env.PORT || 5000; // Definisci la porta qui

app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});