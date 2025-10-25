"use client";

import React, { useState } from 'react';
import { useSupabase } from './SupabaseProvider';
import * as api from '../api'; // Importa le funzioni API

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { supabase } = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('Login riuscito!');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // Se la registrazione è riuscita, crea un record corrispondente nella tabella public.users
        if (data.user && data.session) {
          await api.saveUser({
            id: data.user.id,
            name: data.user.email || 'Nuovo Utente', // Usa l'email come nome predefinito
            role: 'Tecnico', // Ruolo predefinito
          }, data.session.access_token); // Passa il token di accesso per la chiamata API
        }
        setMessage('Registrazione riuscita! Controlla la tua email per la conferma.');
      }
    } catch (error: any) {
      setMessage(`Errore: ${error.message}`);
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full"> {/* Rimosso bg-blue-200 */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {isLogin ? 'Accedi' : 'Registrati'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email" {/* Aggiunto autocomplete */}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? "current-password" : "new-password"} {/* Aggiunto autocomplete */}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {message && (
            <p className={`text-center text-sm mb-4 ${message.startsWith('Errore') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-2 mt-4"
          >
            {loading ? 'Caricamento...' : (isLogin ? 'Accedi' : 'Registrati')}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-600">
          {isLogin ? 'Non hai un account?' : 'Hai già un account?'}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline ml-1"
          >
            {isLogin ? 'Registrati' : 'Accedi'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;