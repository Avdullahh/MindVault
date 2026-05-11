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
        'rounded-xl py-3 items-center',
        isPrimary ? 'bg-teal-500' : 'border border-teal-500',
        disabled || loading ? 'opacity-50' : '',
      ].join(' ')}
    >
      {loading
        ? <ActivityIndicator color={isPrimary ? '#fff' : '#2dd4bf'} />
        : <Text className={['font-semibold text-base', isPrimary ? 'text-white' : 'text-teal-400'].join(' ')}>{label}</Text>
      }
    </Pressable>
  );
}
