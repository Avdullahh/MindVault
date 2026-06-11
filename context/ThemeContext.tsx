import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { Platform, View } from 'react-native';
import { useColorScheme, vars } from 'nativewind';
import * as SecureStore from 'expo-secure-store';
import {
  lightColors,
  darkColors,
  lightVars,
  darkVars,
  type ThemeColors,
} from '../theme/colors';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme-mode';
const isWeb = Platform.OS === 'web';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

async function readStoredMode(): Promise<ThemeMode | null> {
  try {
    if (isWeb) {
      if (typeof localStorage === 'undefined') return null;
      const value = localStorage.getItem(STORAGE_KEY);
      return isThemeMode(value) ? value : null;
    }
    const value = await SecureStore.getItemAsync(STORAGE_KEY);
    return isThemeMode(value) ? value : null;
  } catch {
    return null;
  }
}

async function writeStoredMode(mode: ThemeMode): Promise<void> {
  try {
    if (isWeb) {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, mode);
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, mode);
  } catch {
    // Persistence is best-effort; never crash on storage failure.
  }
}

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (next: ThemeMode) => void;
  colorScheme: 'light' | 'dark';
  colors: ThemeColors;
  themeLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    readStoredMode()
      .then((savedMode) => {
        if (!mounted) return;
        if (savedMode) {
          setModeState(savedMode);
          setColorScheme(savedMode);
        }
      })
      .finally(() => {
        if (mounted) setThemeLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [setColorScheme]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setColorScheme(next);
    void writeStoredMode(next);
  }, [setColorScheme]);

  const resolved: 'light' | 'dark' = colorScheme ?? 'light';
  const colors = resolved === 'dark' ? darkColors : lightColors;

  // On web, sync a `dark` class on <html> so .dark:root CSS variables cascade
  // into React Native Modal portals (which render outside the ThemeProvider View).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolved]);

  // Authoritative theme switching for NativeWind `className` semantic tokens on
  // native: inject the CSS variables at the root so all descendants inherit them
  // reactively. (A plain `.dark` selector is not applied by NativeWind on native.)
  const themeStyle = useMemo(
    () => vars(resolved === 'dark' ? darkVars : lightVars),
    [resolved]
  );

  const contextValue = useMemo(
    () => ({ mode, setMode, colorScheme: resolved, colors, themeLoaded }),
    [mode, setMode, resolved, colors, themeLoaded]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <View style={[{ flex: 1 }, themeStyle]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}
