import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/auth-context';

export default function Register() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const err = await signUp(email.trim(), password);
    if (err) setError(err);
    else setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <View className="flex-1 bg-leather-900 justify-center px-6">
        <Text className="text-2xl font-bold text-gold-400 mb-4" style={{ fontFamily: 'Georgia' }}>Check your email</Text>
        <Text className="text-leather-200 mb-8">
          We sent a confirmation link to {email}. Open it to activate your account, then log in.
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable className="bg-gold-500 rounded-xl py-3 items-center">
            <Text className="text-leather-50 font-semibold text-base">Back to login</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-leather-900 justify-center px-6">
      <Text className="text-3xl font-bold text-gold-400 mb-8" style={{ fontFamily: 'Georgia' }}>Create account</Text>

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
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text className="text-leather-50 font-semibold text-base">Create account</Text>
        }
      </Pressable>

      <Link href="/(auth)/login" asChild>
        <Pressable className="items-center">
          <Text className="text-leather-300">
            Already have an account?{' '}
            <Text className="text-gold-400">Log in</Text>
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
