import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { useThemeColors } from '../../context/ThemeContext';
import { AuthFormContainer } from '../../components/ui/AuthFormContainer';

export default function Login() {
  const { signIn } = useAuth();
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
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text className="text-foreground font-semibold text-base">Log in</Text>
        }
      </Pressable>

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
