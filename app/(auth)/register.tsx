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
      <View className="flex-1 bg-gray-900 justify-center px-6">
        <Text className="text-2xl font-bold text-teal-400 mb-4">Check your email</Text>
        <Text className="text-gray-300 mb-8">
          We sent a confirmation link to {email}. Open it to activate your account, then log in.
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable className="bg-teal-500 rounded-xl py-3 items-center">
            <Text className="text-white font-semibold text-base">Back to login</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900 justify-center px-6">
      <Text className="text-3xl font-bold text-teal-400 mb-8">Create account</Text>

      <TextInput
        className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-4"
        placeholder="Email"
        placeholderTextColor="#6b7280"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="bg-gray-800 text-white rounded-xl px-4 py-3 mb-4"
        placeholder="Password"
        placeholderTextColor="#6b7280"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text className="text-red-400 mb-4 text-sm">{error}</Text>}

      <Pressable
        className="bg-teal-500 rounded-xl py-3 items-center mb-6"
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text className="text-white font-semibold text-base">Create account</Text>
        }
      </Pressable>

      <Link href="/(auth)/login" asChild>
        <Pressable className="items-center">
          <Text className="text-gray-400">
            Already have an account?{' '}
            <Text className="text-teal-400">Log in</Text>
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
