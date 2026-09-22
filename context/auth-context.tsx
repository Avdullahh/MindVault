import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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

type OAuthResult =
  | { status: 'success' }
  | { status: 'cancelled'; message: string }
  | { status: 'error'; message: string };

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithOtp: (email: string) => Promise<string | null>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<OAuthResult>;
  updateAccount: (payload: AccountUpdatePayload) => Promise<AccountUpdateResult>;
  refreshSession: () => Promise<boolean>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const MAGIC_LINK_EXPIRED_MESSAGE =
  'This link has expired or has already been used. Please request a new one.';

function getAuthExchangeErrorMessage(error: unknown) {
  if (!error) return 'Could not complete sign-in. Please try again.';

  if (typeof error === 'string') {
    return error.toLowerCase().includes('invalid grant') ? MAGIC_LINK_EXPIRED_MESSAGE : error;
  }

  if (typeof error !== 'object') return 'Could not complete sign-in. Please try again.';

  const maybeError = error as { code?: unknown; message?: unknown; status?: unknown };
  const code = typeof maybeError.code === 'string' ? maybeError.code.toLowerCase() : '';
  const message = typeof maybeError.message === 'string' ? maybeError.message : '';
  const status = typeof maybeError.status === 'number' ? maybeError.status : null;
  const lowerMessage = message.toLowerCase();

  if (
    code === 'bad_code' ||
    code === 'invalid_grant' ||
    code === 'otp_expired' ||
    status === 400 ||
    lowerMessage.includes('invalid grant') ||
    lowerMessage.includes('expired') ||
    lowerMessage.includes('already been used')
  ) {
    return MAGIC_LINK_EXPIRED_MESSAGE;
  }

  return message || 'Could not complete sign-in. Please try again.';
}

function appendSearchParams(target: URLSearchParams, value: string | null | undefined) {
  if (!value) return;

  const normalized = value.replace(/^[#?]/, '');
  const queryStart = normalized.indexOf('?');
  const paramsString = queryStart >= 0 ? normalized.slice(queryStart + 1) : normalized;

  new URLSearchParams(paramsString).forEach((paramValue, key) => {
    target.set(key, paramValue);
  });
}

function getFirstParam(params: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    const value = params.get(key);
    if (value) return value;
  }
  return null;
}

function parseAuthCallbackParams(url: string) {
  const params = new URLSearchParams();

  try {
    const parsed = new URL(url);
    parsed.searchParams.forEach((value, key) => {
      params.set(key, value);
    });
    appendSearchParams(params, parsed.hash);
  } catch {
    appendSearchParams(params, url);
  }

  return {
    code: getFirstParam(params, ['code']),
    error: getFirstParam(params, ['error']),
    errorCode: getFirstParam(params, ['error_code']),
    errorDescription: getFirstParam(params, ['error_description', 'error_description[]']),
  };
}

function getAuthCallbackErrorMessage(url: string) {
  const { error, errorCode, errorDescription } = parseAuthCallbackParams(url);
  if (!error && !errorCode && !errorDescription) return null;

  return getAuthExchangeErrorMessage({
    code: errorCode ?? error ?? undefined,
    message: errorDescription ?? error ?? undefined,
  });
}

// Shared by the magic-link deep-link listener and the OAuth browser flow:
// both hand the app back a redirect URL carrying a PKCE `code` param that
// needs exchanging for a session.
async function exchangeCodeFromUrl(url: string | null) {
  if (!url) return null;
  const { code } = parseAuthCallbackParams(url);
  if (!code) return null;
  return supabase.auth.exchangeCodeForSession(code);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const handledUrlsRef = useRef(new Set<string>());

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
      if (!url || handledUrlsRef.current.has(url)) return;
      handledUrlsRef.current.add(url);

      const callbackError = getAuthCallbackErrorMessage(url);
      if (callbackError) {
        setAuthError(callbackError);
        return;
      }

      try {
        const result = await exchangeCodeFromUrl(url);
        if (result?.error) {
          setAuthError(getAuthExchangeErrorMessage(result.error));
          return;
        }
        if (result && !result.error && result.data.session) setSession(result.data.session);
      } catch (error) {
        setAuthError(getAuthExchangeErrorMessage(error));
        return;
      }
    };

    void handleUrl(Linking.getLinkingURL());
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

  const signInWithOAuth = async (provider: OAuthProvider): Promise<OAuthResult> => {
    const redirectTo = Linking.createURL('/');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) return { status: 'error', message: error.message };
    if (!data.url) return { status: 'error', message: `${provider} sign-in is not configured` };

    const WebBrowser = await import('expo-web-browser').catch(() => null);
    if (!WebBrowser) {
      await Linking.openURL(data.url);
      return { status: 'success' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo).catch(() => null);
    if (!result) {
      return { status: 'error', message: `Could not complete ${provider} sign-in. Please try again.` };
    }
    if (result.type !== 'success') {
      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { status: 'cancelled', message: 'Sign-in was cancelled.' };
      }
      return { status: 'error', message: `Could not complete ${provider} sign-in. Please try again.` };
    }

    const exchange = await exchangeCodeFromUrl(result.url);
    if (!exchange) return { status: 'error', message: `Could not complete ${provider} sign-in` };
    if (exchange.error) return { status: 'error', message: getAuthExchangeErrorMessage(exchange.error) };
    if (exchange.data.session) {
      if (provider === 'apple' && exchange.data.session.provider_refresh_token) {
        void supabase.functions.invoke('store-apple-credential', {
          body: { refreshToken: exchange.data.session.provider_refresh_token },
        }).then(({ error }) => {
          if (error) console.warn('Failed to store Apple credential', error);
        }).catch((err) => {
          console.warn('Failed to store Apple credential', err);
        });
      }
      setSession(exchange.data.session);
    }
    return { status: 'success' };
  };

  const clearAuthError = useCallback(() => setAuthError(null), []);

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

  // Deletes the account server-side (via the delete-account Edge Function,
  // which needs the service-role key to call auth.admin.deleteUser) then
  // clears local session state the same way signOut() does.
  const deleteAccount = async (): Promise<string | null> => {
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) {
      const fnError = error as { message: string; context?: Response };
      let message = fnError.message;
      if (fnError.context) {
        const payload = await fnError.context.clone().json().catch(() => null);
        if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
          message = payload.error;
        }
      }
      return message;
    }

    await supabase.auth.signOut();
    setSession(null);
    clearPersistedQueryCache();
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        authError,
        clearAuthError,
        signInWithOtp,
        signInWithOAuth,
        updateAccount,
        refreshSession,
        signOut,
        deleteAccount,
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
