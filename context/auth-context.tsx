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
  signInWithOtp: (email: string) => Promise<string | null>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<string | null>;
  updateAccount: (payload: AccountUpdatePayload) => Promise<AccountUpdateResult>;
  refreshSession: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Shared by the magic-link deep-link listener and the OAuth browser flow:
// both hand the app back a redirect URL carrying a PKCE `code` param that
// needs exchanging for a session.
async function exchangeCodeFromUrl(url: string | null) {
  if (!url) return null;
  const parsed = Linking.parse(url);
  const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : null;
  if (!code) return null;
  return supabase.auth.exchangeCodeForSession(code);
}

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

  // Magic-link emails (and OAuth's own fallback path, if the browser hands
  // control back via a bare redirect) land here as a deep link carrying a
  // PKCE `code` param. Exchange it for a session whenever the app is opened
  // or resumed with one.
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      const result = await exchangeCodeFromUrl(url);
      if (result && !result.error && result.data.session) setSession(result.data.session);
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

  const signInWithOtp = async (email: string) => {
    const redirectTo = Linking.createURL('/');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
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

    const exchange = await exchangeCodeFromUrl(result.url);
    if (!exchange) return `Could not complete ${provider} sign-in`;
    if (exchange.error) return exchange.error.message;
    if (exchange.data.session) setSession(exchange.data.session);
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

  // Re-checks Supabase's local session, for the "I opened the link" affordance:
  // the deep-link listener above normally picks up a magic-link redirect on its
  // own, but a user who tapped the link in another app/tab can use this to
  // nudge the app into noticing the session it already exchanged.
  const refreshSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    return Boolean(data.session);
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
        signInWithOtp,
        signInWithOAuth,
        updateAccount,
        refreshSession,
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
