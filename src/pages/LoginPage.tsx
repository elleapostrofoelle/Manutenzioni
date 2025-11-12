// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useSupabase } from '../components/SupabaseProvider'; // Importa useSupabase
import '../styles/LoginPage.css';

const LoginPage: React.FC = () => {
  const { supabase } = useSupabase(); // Ottieni l'istanza di supabase
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // Per feedback all'utente

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Errore login: ${error.message}`);
        console.error('Login error:', error);
      } else {
        // La sessione verrà aggiornata automaticamente dal SupabaseProvider
        // e il componente App cambierà per mostrare MainAppContent
        console.log('Login successful');
        setMessage('Accesso effettuato con successo!');
      }
    } catch (err: any) {
      setMessage(`Errore inaspettato: ${err.message}`);
      console.error('Unexpected login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Puoi decidere se la registrazione avviene direttamente qui o navighi ad altra pagina.
      // Per semplicità, aggiungiamo una registrazione diretta con email/password.
      // Solitamente si richiede anche una conferma email.
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(`Errore registrazione: ${error.message}`);
        console.error('Sign up error:', error);
      } else {
        setMessage('Registrazione riuscita! Controlla la tua email per la conferma.');
        console.log('Sign up successful');
        // Se la registrazione richiede conferma email, l'utente non sarà autenticato immediatamente.
        // Se non richiede conferma, la sessione verrà aggiornata.
      }
    } catch (err: any) {
      setMessage(`Errore inaspettato: ${err.message}`);
      console.error('Unexpected sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        {/* Potresti aggiungere un logo qui, se ne hai uno. Esempio: */}
        {/* <img src="/path/to/your/logo.svg" alt="App Logo" className="login-logo" /> */}
        
        <h1 className="app-name">Gestione Manutenzioni</h1>
        
        <h2 className="login-title">Accedi</h2>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Inserisci la tua email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              // CORREZIONE TS/React: usa autoComplete
              autoComplete="username" 
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Inserisci la tua password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              // CORREZIONE TS/React: usa autoComplete
              autoComplete="current-password" 
            />
          </div>

          {message && <p className={`login-message ${message.startsWith('Errore') ? 'error' : 'success'}`}>{message}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Caricamento...' : 'Accedi'}
          </button>
        </form>

        <p className="register-text">
          Non hai un account? <button type="button" onClick={handleRegister} className="register-link-button" disabled={loading}>
            Registrati
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;