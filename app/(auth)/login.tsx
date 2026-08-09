import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { useThemeColors } from '../../context/ThemeContext';
import { AuthFormContainer } from '../../components/ui/AuthFormContainer';

export default function Login() {
  const { signIn, signInWithOAuth } = useAuth();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setLoading(true);
    setError(null);
    const err = await signIn(email.trim(), password);
    if (err) setError(err);
    setLoading(false);
  };

  const handleOAuth = async (provider: 'apple' | 'google') => {
    setLoading(true);
    setError(null);
    const err = await signInWithOAuth(provider);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <AuthFormContainer>
      <Image
        source={require('../../assets/icon.png')}
        className="w-24 h-24 rounded-2xl mb-5 self-center"
        accessibilityLabel="MindVault logo"
      />
      <Text className="text-3xl font-bold text-primary mb-2 font-rounded">MindVault</Text>
      <Text className="text-muted text-sm leading-5 mb-8">Capture ideas, connect them to action, and come back to what matters.</Text>

      <TextInput
        className="bg-surface text-foreground rounded-xl px-4 py-3 mb-4"
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="bg-surface text-foreground rounded-xl px-4 py-3 mb-4"
        placeholder="Password"
        placeholderTextColor={colors.muted}
        autoComplete="password"
        textContentType="password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text selectable className="text-destructive mb-4 text-sm">{error}</Text> : null}

      <Pressable
        className="bg-primary rounded-xl py-3 items-center mb-6"
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.primaryForeground} />
          : <Text className="text-foreground font-semibold text-base">Log in</Text>
        }
      </Pressable>

      <View className="gap-3 mb-6">
        <Pressable
          className="bg-surface border border-border rounded-xl py-3 items-center"
          onPress={() => handleOAuth('apple')}
          disabled={loading}
          accessibilityRole="button"
        >
          <Text className="text-foreground font-semibold text-base">Continue with Apple</Text>
        </Pressable>
        <Pressable
          className="bg-surface border border-border rounded-xl py-3 items-center"
          onPress={() => handleOAuth('google')}
          disabled={loading}
          accessibilityRole="button"
        >
          <Text className="text-foreground font-semibold text-base">Continue with Google</Text>
        </Pressable>
      </View>

      <Link href="/(auth)/register" asChild>
        <Pressable className="items-center">
          <Text className="text-muted">
            Don't have an account?{' '}
            <Text className="text-primary">Sign up</Text>
          </Text>
        </Pressable>
      </Link>
    </AuthFormContainer>
  );
}
