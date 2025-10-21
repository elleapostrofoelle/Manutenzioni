import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carica le variabili d'ambiente dal file .env
dotenv.config();

async function testDbConnection() {
  console.log('Tentativo di connessione al database...');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_PORT:', process.env.DB_PORT);
  // Non stampare la password per motivi di sicurezza

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Assicurati che la password sia impostata nel .env
    database: process.env.DB_NAME || 'manutenzioni',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Connessione al database MySQL riuscita!');

    // Esegui una query di prova
    const [rows] = await connection.query('SELECT 1+1 AS solution;');
    console.log('Query di prova eseguita con successo:', rows);

  } catch (error) {
    console.error('Errore durante la connessione o la query al database:', error);
    console.error('Assicurati che le credenziali nel file .env siano corrette e che il server MySQL sia in esecuzione.');
  } finally {
    if (connection) {
      connection.release();
      console.log('Connessione rilasciata.');
    }
    await pool.end(); // Chiudi il pool di connessioni
    console.log('Pool di connessioni chiuso.');
  }
}

testDbConnection();