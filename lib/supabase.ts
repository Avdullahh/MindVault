import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '../types/database.generated';

// expo-secure-store has a 2 KB per-key limit on iOS. Supabase session tokens
// can exceed that, so we transparently chunk the value across numbered keys.
const CHUNK_SIZE = 2000;
const isWeb = Platform.OS === 'web';

function getWebStorage() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

const ChunkedSecureStore = {
  getItem: async (key: string) => {
    if (isWeb) return getWebStorage()?.getItem(key) ?? null;

    const countStr = await SecureStore.getItemAsync(`${key}.count`);
    if (!countStr) return null;
    const count = parseInt(countStr, 10);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(`${key}.${i}`),
      ),
    );
    if (chunks.some((c) => c === null)) return null;
    return chunks.join('');
  },

  setItem: async (key: string, value: string) => {
    if (isWeb) {
      getWebStorage()?.setItem(key, value);
      return;
    }

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}.count`, chunks.length.toString());
    await Promise.all(
      chunks.map((chunk, i) =>
        SecureStore.setItemAsync(`${key}.${i}`, chunk),
      ),
    );
  },

  removeItem: async (key: string) => {
    if (isWeb) {
      getWebStorage()?.removeItem(key);
      return;
    }

    const countStr = await SecureStore.getItemAsync(`${key}.count`);
    if (!countStr) return;
    const count = parseInt(countStr, 10);
    await SecureStore.deleteItemAsync(`${key}.count`);
    await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}.${i}`),
      ),
    );
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ChunkedSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
