import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth-context';
import { useThemeColors } from '../../context/ThemeContext';
import { AuthFormContainer } from '../../components/ui/AuthFormContainer';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { OAuthButtons } from '../../components/ui/OAuthButtons';

const RESEND_COOLDOWN_SECONDS = 30;

export default function Login() {
  const { signInWithOtp, refreshSession } = useAuth();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Standard countdown pattern: each tick schedules the next one, so the
  // effect's own dependency array does the "stop at zero" bookkeeping.
  useEffect(() => {
    if (cooldown === 0) return;
    const timeout = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timeout);
  }, [cooldown]);

  const startCooldown = () => setCooldown(RESEND_COOLDOWN_SECONDS);

  const handleSendLink = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    setError(null);
    const err = await signInWithOtp(trimmed);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setSent(true);
    startCooldown();
  };

  const handleCheckOpened = async () => {
    setLoading(true);
    setError(null);
    const hasSession = await refreshSession();
    setLoading(false);
    if (!hasSession) setError("We haven't seen that link opened yet. Try again in a moment.");
  };

  if (sent) {
    return (
      <AuthFormContainer>
        <Card className="items-center">
          <View className="w-14 h-14 rounded-full bg-background items-center justify-center mb-4">
            <Ionicons name="mail-open-outline" size={26} color={colors.primary} />
          </View>
          <Text className="text-xl font-bold text-primary mb-2 font-rounded">Check your email</Text>
          <Text className="text-foreground text-sm text-center leading-5 mb-6">
            We sent a one-time sign-in link to {email.trim()}. Open it on this device and you'll land straight in your vault.
          </Text>

          {error ? <Text selectable className="text-destructive mb-4 text-sm">{error}</Text> : null}

          <View className="flex-row gap-3 self-stretch">
            <View className="flex-1">
              <Button label="I opened the link" onPress={handleCheckOpened} loading={loading} />
            </View>
            <View className="flex-1">
              <Button
                label={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
                variant="ghost"
                onPress={handleSendLink}
                disabled={cooldown > 0}
                loading={loading}
              />
            </View>
          </View>
        </Card>

        <Pressable
          className="items-center mt-8"
          onPress={() => {
            setSent(false);
            setError(null);
          }}
        >
          <Text className="text-muted">
            <Ionicons name="arrow-back" size={14} color={colors.muted} />{'  '}Use a different email
          </Text>
        </Pressable>
      </AuthFormContainer>
    );
  }

  return (
    <AuthFormContainer>
      <Text className="text-3xl font-bold text-primary mb-2 font-rounded text-center">Sign in</Text>
      <Text className="text-muted text-sm leading-5 mb-8 text-center">
        One account keeps every idea, goal and project in sync.
      </Text>

      <OAuthButtons loading={loading} onLoadingChange={setLoading} onError={setError} />

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-border" />
        <Text className="text-muted text-xs font-semibold mx-3">OR USE EMAIL</Text>
        <View className="flex-1 h-px bg-border" />
      </View>

      <Text className="text-muted text-xs font-semibold mb-2">EMAIL</Text>
      <TextInput
        className="bg-surface text-foreground rounded-xl px-4 py-3 mb-2"
        placeholder="you@example.com"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Text className="text-muted text-xs mb-4">We'll email you a link — no password needed.</Text>

      {error ? <Text selectable className="text-destructive mb-4 text-sm">{error}</Text> : null}

      <View className="mb-6">
        <Button label="Send me a link" variant="ghost" onPress={handleSendLink} loading={loading} />
      </View>

      <Text className="text-muted text-sm text-center">
        New here? The same buttons create your vault — there's nothing else to set up.
      </Text>

      <Pressable className="items-center mt-6" onPress={() => router.back()}>
        <Text className="text-primary">Back</Text>
      </Pressable>
    </AuthFormContainer>
  );
}
