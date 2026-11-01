import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

const SITE_URL = 'https://calabarzon-tour.netlify.app/';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(true);

  const loadRole = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    setRole(!error && data?.role === 'admin' ? 'admin' : 'viewer');
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await loadRole(data.session.user.id);
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        // setTimeout para iwas deadlock sa supabase callback
        setTimeout(() => loadRole(newSession.user.id), 0);
      } else {
        setRole('viewer');
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadRole]);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email: email.trim(), password });

  // Laging 'viewer' ang bagong register (database trigger ang nagse-set)
  const signUp = (email, password) =>
    supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${SITE_URL}/confirmed.html` }
    });

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role,
        isAdmin: role === 'admin',
        loading,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
