// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Import the compiled server
import('./dist/server.js').then(() => {
    console.log('Application started successfully');
}).catch((err) => {
    console.error('Failed to start application:', err);
    process.exit(1);
});
