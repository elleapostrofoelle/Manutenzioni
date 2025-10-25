/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Aggiungi qui altre variabili d'ambiente VITE_ che usi nel frontend
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}