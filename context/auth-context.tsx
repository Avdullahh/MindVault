import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { clearPersistedQueryCache } from '../lib/query-client';

type OAuthProvider = 'apple' | 'google';

type AccountUpdatePayload = {
  displayName: string | null;
  avatarUrl: string | null;
  email?: string;
  password?: string;
};

type AccountUpdateResult = {
  error: string | null;
  emailChangePending: boolean;
};

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<string | null>;
  updateAccount: (payload: AccountUpdatePayload) => Promise<AccountUpdateResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession()
      .then(({ data }) => {
        if (mounted) setSession(data.session);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (data.session) setSession(data.session);
    return error?.message ?? null;
  };

  const signInWithOAuth = async (provider: OAuthProvider) => {
    const redirectTo = Linking.createURL('/');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) return error.message;
    if (!data.url) return `${provider} sign-in is not configured`;

    const WebBrowser = await import('expo-web-browser').catch(() => null);
    if (!WebBrowser) {
      await Linking.openURL(data.url);
      return null;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return null;

    const parsed = Linking.parse(result.url);
    const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : null;
    if (!code) return `Could not complete ${provider} sign-in`;

    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) return exchangeError.message;
    if (sessionData.session) setSession(sessionData.session);
    return null;
  };

  const updateAccount = async ({
    displayName,
    avatarUrl,
    email,
    password,
  }: AccountUpdatePayload): Promise<AccountUpdateResult> => {
    const update: Parameters<typeof supabase.auth.updateUser>[0] = {
      data: {
        display_name: displayName,
        avatar_url: avatarUrl,
      },
    };

    if (email) update.email = email;
    if (password) update.password = password;

    const { error } = await supabase.auth.updateUser(update);
    if (error) return { error: error.message, emailChangePending: false };

    const { data } = await supabase.auth.getSession();
    setSession(data.session);

    return { error: null, emailChangePending: Boolean(email) };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    clearPersistedQueryCache();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signIn,
        signUp,
        signInWithOAuth,
        updateAccount,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
