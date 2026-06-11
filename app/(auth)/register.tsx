import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { useThemeColors } from '../../context/ThemeContext';
import { AuthFormContainer } from '../../components/ui/AuthFormContainer';

export default function Register() {
  const { signUp } = useAuth();
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

  if (success) {
    return (
      <View className="flex-1 bg-background justify-center px-6">
        <Text className="text-2xl font-bold text-primary mb-4" style={{ fontFamily: 'Georgia' }}>Check your email</Text>
        <Text className="text-foreground mb-8">
          We sent a confirmation link to {email}. Open it to activate your account, then log in.
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
      <Text className="text-3xl font-bold text-primary mb-8" style={{ fontFamily: 'Georgia' }}>Create account</Text>

      <TextInput
        className="bg-surface text-foreground rounded-xl px-4 py-3 mb-4"
        placeholder="Email"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="bg-surface text-foreground rounded-xl px-4 py-3 mb-4"
        placeholder="Password"
        placeholderTextColor={colors.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text className="text-red-400 mb-4 text-sm">{error}</Text>}

      <Pressable
        className="bg-primary rounded-xl py-3 items-center mb-6"
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text className="text-foreground font-semibold text-base">Create account</Text>
        }
      </Pressable>

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
