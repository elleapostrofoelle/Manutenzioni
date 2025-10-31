import app from './server.ts'; // Importa l'applicazione Express da server.ts
import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT || 5000;

// Aggiungi gestori globali per eccezioni non catturate e rejection di Promise
process.on('uncaughtException', (err) => {
  console.error('ERRORE NON CATTURATO (UNCAUGHT EXCEPTION):', err);
  process.exit(1); // Termina il processo con un codice di errore
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('REJECTION NON GESTITA (UNHANDLED REJECTION) a:', promise, 'motivo:', reason);
  process.exit(1); // Termina il processo con un codice di errore
});

try {
  app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
  }).on('error', (err: NodeJS.ErrnoException) => {
    // Cattura errori specifici dalla chiamata listen (es. porta già in uso)
    if (err.code === 'EADDRINUSE') {
      console.error(`Errore: La porta ${port} è già in uso. Assicurati che nessun altro programma la stia usando.`);
    } else {
      console.error('Errore durante l\'avvio del server:', err);
    }
    process.exit(1);
  });
} catch (err) {
  console.error('Errore sincrono durante l\'inizializzazione dell\'app:', err);
  process.exit(1);
}