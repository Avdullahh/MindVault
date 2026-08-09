import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { useThemeColors } from '../../context/ThemeContext';
import { AuthFormContainer } from '../../components/ui/AuthFormContainer';

export default function Register() {
  const { signUp, signInWithOAuth } = useAuth();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      setError('Enter an email and password');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password');
      return;
    }
    setLoading(true);
    setError(null);
    const err = await signUp(email.trim(), password);
    if (err) setError(err);
    else setSuccess(true);
    setLoading(false);
  };

  const handleOAuth = async (provider: 'apple' | 'google') => {
    setLoading(true);
    setError(null);
    const err = await signInWithOAuth(provider);
    if (err) setError(err);
    setLoading(false);
  };

  if (success) {
    return (
      <View className="flex-1 bg-background justify-center px-6">
        <Text className="text-2xl font-bold text-primary mb-4 font-rounded">Check your email</Text>
        <Text className="text-foreground mb-8">
          If your account needs confirmation, we sent a link to {email}. If confirmation is not required, MindVault will open automatically.
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable className="bg-primary rounded-xl py-3 items-center">
            <Text className="text-foreground font-semibold text-base">Back to login</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <AuthFormContainer>
      <Text className="text-3xl font-bold text-primary mb-8 font-rounded">Create account</Text>

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
        autoComplete="new-password"
        textContentType="newPassword"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text selectable className="text-destructive mb-4 text-sm">{error}</Text> : null}

      <Pressable
        className="bg-primary rounded-xl py-3 items-center mb-6"
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.primaryForeground} />
          : <Text className="text-foreground font-semibold text-base">Create account</Text>
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

      <Link href="/(auth)/login" asChild>
        <Pressable className="items-center">
          <Text className="text-muted">
            Already have an account?{' '}
            <Text className="text-primary">Log in</Text>
          </Text>
        </Pressable>
      </Link>
    </AuthFormContainer>
  );
}
