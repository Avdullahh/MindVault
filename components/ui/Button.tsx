import { ActivityIndicator, Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', loading = false, disabled = false }: Props) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={[
        'rounded-xl min-h-11 px-4 py-3 items-center justify-center',
        isPrimary ? 'bg-gold-500' : 'border border-gold-500',
        disabled || loading ? 'opacity-50' : '',
      ].join(' ')}
    >
      {loading
        ? <ActivityIndicator color={isPrimary ? '#fff' : '#d4a017'} />
        : <Text className={['font-semibold text-base', isPrimary ? 'text-leather-50' : 'text-gold-400'].join(' ')}>{label}</Text>
      }
    </Pressable>
  );
}
