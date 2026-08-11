import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth-context';
import { useThemeColors } from '../../context/ThemeContext';
import { Button } from './Button';

type Props = {
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string | null) => void;
};

// Shared by the welcome and login screens — both offer the same
// Apple/Google continue-with-OAuth actions.
export function OAuthButtons({ loading, onLoadingChange, onError }: Props) {
  const { signInWithOAuth } = useAuth();
  const colors = useThemeColors();

  const handleOAuth = async (provider: 'apple' | 'google') => {
    onLoadingChange(true);
    onError(null);
    const err = await signInWithOAuth(provider);
    if (err) onError(err);
    onLoadingChange(false);
  };

  return (
    <View className="gap-3 mb-6">
      <Button
        label="Continue with Apple"
        onPress={() => handleOAuth('apple')}
        loading={loading}
        icon={<Ionicons name="logo-apple" size={18} color={colors.primaryForeground} />}
      />
      <Button
        label="Continue with Google"
        variant="ghost"
        onPress={() => handleOAuth('google')}
        loading={loading}
        icon={<Ionicons name="logo-google" size={18} color={colors.primary} />}
      />
    </View>
  );
}
