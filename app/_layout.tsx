import '../global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/auth-context';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { QueryProvider } from '../lib/query-client';

void SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(app)');
    }
    void SplashScreen.hideAsync();
  }, [session, loading, segments]);

  return null;
}

function ThemedApp() {
  const { colorScheme, themeLoaded, colors } = useTheme();

  // Flicker gate: avoid rendering the app before the persisted theme resolves.
  if (!themeLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} animated />
      <AuthProvider>
        <QueryProvider>
          <AuthGate />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryProvider>
      </AuthProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
