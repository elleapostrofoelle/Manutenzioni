const path = require('path');

module.exports = {
  apps : [{
    name   : "manutenzioni-api",
    // Usa path.join per costruire un percorso assoluto e corretto per Windows
    script : path.join(__dirname, 'dist', 'backend', 'server.js'),
    env_production: {
       NODE_ENV: "production",
       SUPABASE_URL: "https://ntelzdfffqlvxcmqffld.supabase.co",
       SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50ZWx6ZGZmZnFsdnhjbXFmZmxkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTA2NzYzMSwiZXhwIjoyMDc2NjQzNjMxfQ.RRNjGz5BO-g9Wji0Ebg7qZgLwVhbBuGyr5jCm7tbzRk"
    }
  }]
}