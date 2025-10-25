import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('SupabaseClient: VITE_SUPABASE_URL:', supabaseUrl ? 'present' : 'missing');
console.log('SupabaseClient: VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'present' : 'missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variabili d\'ambiente VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY non impostate.');
  throw new Error('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);