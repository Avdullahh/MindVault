import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../context/ThemeContext';
import { AuthFormContainer } from '../../components/ui/AuthFormContainer';
import { OAuthButtons } from '../../components/ui/OAuthButtons';

const FEATURES = [
  { icon: 'bulb-outline' as const, label: 'Capture ideas the moment they land.' },
  { icon: 'flag-outline' as const, label: 'Link them to the goals they serve.' },
  { icon: 'git-network-outline' as const, label: 'See the whole map, not just the list.' },
];

export default function Welcome() {
  const colors = useThemeColors();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <AuthFormContainer>
      <Image
        source={require('../../assets/icon.png')}
        className="w-24 h-24 rounded-2xl mb-5 self-center"
        accessibilityLabel="MindVault logo"
      />
      <Text className="text-3xl font-bold text-primary mb-2 font-rounded text-center">MindVault</Text>
      <Text className="text-muted text-sm leading-5 mb-8 text-center">The connective layer between thinking and doing.</Text>

      <View className="gap-4 mb-8">
        {FEATURES.map((feature) => (
          <View key={feature.label} className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-full bg-surface items-center justify-center">
              <Ionicons name={feature.icon} size={18} color={colors.primary} />
            </View>
            <Text className="text-foreground text-sm flex-1">{feature.label}</Text>
          </View>
        ))}
      </View>

      {error ? <Text selectable className="text-destructive mb-4 text-sm">{error}</Text> : null}

      <OAuthButtons loading={loading} onLoadingChange={setLoading} onError={setError} />

      <Pressable
        className="flex-row items-center justify-center gap-2 mb-8"
        onPress={() => router.push('/(auth)/login')}
        disabled={loading}
        accessibilityRole="button"
      >
        <Ionicons name="mail-outline" size={16} color={colors.foreground} />
        <Text className="text-foreground font-semibold text-base">Continue with email</Text>
      </Pressable>

      <Text className="text-muted text-xs leading-4 text-center">
        Signing in stores your vault to your account.
      </Text>
    </AuthFormContainer>
  );
}
