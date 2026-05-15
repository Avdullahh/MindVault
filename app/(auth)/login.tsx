import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { AuthFormContainer } from '../../components/ui/AuthFormContainer';

export default function Login() {
  const { signIn } = useAuth();
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
      <Text className="text-3xl font-bold text-gold-400 mb-2" style={{ fontFamily: 'Georgia' }}>MindVault</Text>
      <Text className="text-leather-300 text-sm leading-5 mb-8">Capture ideas, connect them to action, and come back to what matters.</Text>

      <TextInput
        className="bg-leather-800 text-leather-50 rounded-xl px-4 py-3 mb-4"
        placeholder="Email"
        placeholderTextColor="#7a6050"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="bg-leather-800 text-leather-50 rounded-xl px-4 py-3 mb-4"
        placeholder="Password"
        placeholderTextColor="#7a6050"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text className="text-red-400 mb-4 text-sm">{error}</Text>}

      <Pressable
        className="bg-gold-500 rounded-xl py-3 items-center mb-6"
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text className="text-leather-50 font-semibold text-base">Log in</Text>
        }
      </Pressable>

      <Link href="/(auth)/register" asChild>
        <Pressable className="items-center">
          <Text className="text-leather-300">
            Don't have an account?{' '}
            <Text className="text-gold-400">Sign up</Text>
          </Text>
        </Pressable>
      </Link>
    </AuthFormContainer>
  );
}
