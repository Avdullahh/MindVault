import * as SecureStore from 'expo-secure-store';

const LAST_TAB_KEY = 'mindvault_last_tab';

export const storage = {
  getLastTab: () => SecureStore.getItemAsync(LAST_TAB_KEY),
  setLastTab: (name: string) => SecureStore.setItemAsync(LAST_TAB_KEY, name),
};
