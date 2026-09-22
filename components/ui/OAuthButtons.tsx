import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../../context/auth-context';
import { useThemeColors } from '../../context/ThemeContext';
import { Button } from './Button';

type Props = {
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string | null) => void;
  onNotice: (message: string | null) => void;
};

const CONTROL_RADIUS = 12; // Mirrors the `rounded-control` design token.

// Shared by the welcome and login screens — both offer the same
// Apple/Google continue-with-OAuth actions.
export function OAuthButtons({ loading, onLoadingChange, onError, onNotice }: Props) {
  const { signInWithOAuth, clearAuthError } = useAuth();
  const colors = useThemeColors();

  const handleOAuth = async (provider: 'apple' | 'google') => {
    onLoadingChange(true);
    onError(null);
    onNotice(null);
    clearAuthError();
    const result = await signInWithOAuth(provider);
    if (result.status === 'cancelled') onNotice(result.message);
    if (result.status === 'error') onError(result.message);
    onLoadingChange(false);
  };

  return (
    <View className="gap-3 mb-6">
      {Platform.OS === 'ios' ? (
        <View className="rounded-control overflow-hidden">
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={CONTROL_RADIUS}
            onPress={() => {
              if (!loading) void handleOAuth('apple');
            }}
            pointerEvents={loading ? 'none' : 'auto'}
            style={{ width: '100%', height: 44, opacity: loading ? 0.5 : 1 }}
          />
        </View>
      ) : (
        <Button
          label="Continue with Apple"
          onPress={() => handleOAuth('apple')}
          loading={loading}
          icon={<Ionicons name="logo-apple" size={18} color={colors.primaryForeground} />}
        />
      )}
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
