import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('SupabaseProvider: Initial session check. Session:', session);
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('SupabaseProvider: Auth state changed. Event:', _event, 'New Session:', session);
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{marginTop: '1rem'}}>Caricamento sessione...</p>
      </div>
    );
  }

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {/* Questo div ora occupa l'intera area del suo genitore (#root) e gestisce il layout dei suoi figli */}
      <div className="w-full h-full bg-red-200 flex flex-col"> {/* Colore diagnostico */}
        {children}
      </div>
    </SupabaseContext.Provider>
  );
};