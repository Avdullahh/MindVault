// Cross-platform synchronous key/value store backing the React Query persister
// and misc prefs. NOT session storage — Supabase sessions still live in
// expo-secure-store via lib/supabase.ts.
//
// MMKV ships its own localStorage-backed web implementation (resolved by Metro
// via createMMKV.web.js), so there is no platform branching here.
//
// MMKV v4 is a Nitro native module: a dev client built before react-native-mmkv
// was added does not contain it, and createMMKV() throws there. Rather than
// white-screening the app, we fall back to an in-memory Map — same behaviour as
// before this was wired up — and warn once. `storage.isPersistent()` reports
// which backend is live; the dev token screen surfaces it.
import { createMMKV, type MMKV } from 'react-native-mmkv';

const LAST_TAB_KEY = 'mindvault_last_tab';

const memoryFallback = new Map<string, string>();
let mmkv: MMKV | null = null;
let initialized = false;
let warned = false;

function fallBackToMemory(error: unknown) {
  mmkv = null;
  if (warned) return;
  warned = true;
  console.warn(
    '[storage] MMKV unavailable — falling back to in-memory storage, so nothing ' +
      'persists across app restarts. On native this usually means the dev client ' +
      'predates react-native-mmkv and needs rebuilding.',
    error,
  );
}

function getStore(): MMKV | null {
  if (!initialized) {
    initialized = true;
    try {
      mmkv = createMMKV({ id: 'mindvault' });
    } catch (error) {
      fallBackToMemory(error);
    }
  }
  return mmkv;
}

// Reads/writes degrade permanently to the memory map on first failure so the
// two backends never serve interleaved results. On web this also covers the
// server-render case, where MMKV throws on touching localStorage.
function readString(key: string): string | null {
  const store = getStore();
  if (store) {
    try {
      return store.getString(key) ?? null;
    } catch (error) {
      fallBackToMemory(error);
    }
  }
  return memoryFallback.get(key) ?? null;
}

function writeString(key: string, value: string): void {
  const store = getStore();
  if (store) {
    try {
      store.set(key, value);
      return;
    } catch (error) {
      fallBackToMemory(error);
    }
  }
  memoryFallback.set(key, value);
}

function removeKey(key: string): void {
  const store = getStore();
  if (store) {
    try {
      store.remove(key);
      return;
    } catch (error) {
      fallBackToMemory(error);
    }
  }
  memoryFallback.delete(key);
}

export const storage = {
  /** False when running on the in-memory fallback, i.e. nothing survives a restart. */
  isPersistent: () => getStore() !== null,
  getLastTab: () => readString(LAST_TAB_KEY),
  setLastTab: (name: string) => writeString(LAST_TAB_KEY, name),
  getString: readString,
  setString: writeString,
  remove: removeKey,
};
