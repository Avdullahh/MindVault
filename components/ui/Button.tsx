import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false }: Props) {
  const colors = useThemeColors();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={[
        'rounded-xl min-h-11 px-4 py-3 items-center justify-center',
        'border border-primary',
        isPrimary ? 'bg-primary' : '',
        disabled || loading ? 'opacity-50' : '',
      ].join(' ')}
    >
      {loading
        ? <ActivityIndicator color={isPrimary ? colors.primaryForeground : colors.primary} />
        : <Text className={['font-rounded font-semibold text-base', isPrimary ? 'text-primary-foreground' : 'text-primary'].join(' ')}>{label}</Text>
      }
    </Pressable>
  );
}
