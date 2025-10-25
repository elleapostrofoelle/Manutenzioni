import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variabili d\'ambiente VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non impostate.');
  // In un'applicazione reale, potresti voler mostrare un errore all'utente o gestire la situazione in modo più robusto.
  throw new Error('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);