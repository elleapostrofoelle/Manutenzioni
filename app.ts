// app.ts
import app from './dist/backend/server.js'; // Importa l'applicazione Express compilata
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Calcola projectRoot per dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = __dirname; // app.ts è nella root del progetto

dotenv.config({ path: path.resolve(projectRoot, '.env') }); // Carica le variabili d'ambiente

const port = process.env.PORT || 5000;

// Debugging delle variabili d'ambiente per l'avvio
console.log('--- Backend App Startup Log ---');
console.log('Project Root:', projectRoot);
console.log('PORT:', port);
console.log('SUPABASE_URL (present):', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY (present):', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('-------------------------------');


app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});