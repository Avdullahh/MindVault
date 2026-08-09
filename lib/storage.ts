import { Platform } from 'react-native';

const LAST_TAB_KEY = 'mindvault_last_tab';
const isWeb = Platform.OS === 'web';
const memoryStorage = new Map<string, string>();

function getWebStorage() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

export const storage = {
  getLastTab: () => {
    if (isWeb) return getWebStorage()?.getItem(LAST_TAB_KEY) ?? null;
    return memoryStorage.get(LAST_TAB_KEY) ?? null;
  },
  setLastTab: (name: string) => {
    if (isWeb) {
      getWebStorage()?.setItem(LAST_TAB_KEY, name);
      return;
    }
    memoryStorage.set(LAST_TAB_KEY, name);
  },
  getString: (key: string) => {
    if (isWeb) return getWebStorage()?.getItem(key) ?? null;
    return memoryStorage.get(key) ?? null;
  },
  setString: (key: string, value: string) => {
    if (isWeb) {
      getWebStorage()?.setItem(key, value);
      return;
    }
    memoryStorage.set(key, value);
  },
  remove: (key: string) => {
    if (isWeb) {
      getWebStorage()?.removeItem(key);
      return;
    }
    memoryStorage.delete(key);
  },
};
