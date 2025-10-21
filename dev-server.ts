import app from './server.ts'; // Importa l'applicazione Express da server.ts
import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});