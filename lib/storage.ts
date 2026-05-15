import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const LAST_TAB_KEY = 'mindvault_last_tab';
const isWeb = Platform.OS === 'web';

function getWebStorage() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

export const storage = {
  getLastTab: async () => {
    if (isWeb) return getWebStorage()?.getItem(LAST_TAB_KEY) ?? null;
    return SecureStore.getItemAsync(LAST_TAB_KEY);
  },
  setLastTab: async (name: string) => {
    if (isWeb) {
      getWebStorage()?.setItem(LAST_TAB_KEY, name);
      return;
    }
    await SecureStore.setItemAsync(LAST_TAB_KEY, name);
  },
};
