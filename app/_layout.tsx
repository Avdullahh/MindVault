import '../global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  ThemeProvider as NavigationThemeProvider,
  DarkTheme,
  DefaultTheme,
} from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/auth-context';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(app)');
    }
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
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }} />
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
