import { useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void | Promise<unknown>;
  icon?: IoniconsName;
  glyph?: string;
  flex?: boolean;
  compact?: boolean;
};

export function AIButton({
  label,
  loading,
  disabled = false,
  onPress,
  icon = 'sparkles-outline',
  glyph,
  flex = false,
  compact = false,
}: Props) {
  const [internalLoading, setInternalLoading] = useState(false);
  const busy = loading ?? internalLoading;
  const inactive = disabled || busy;

  const handlePress = async () => {
    if (inactive) return;
    const result = onPress();
    if (!result || typeof result.then !== 'function') return;
    setInternalLoading(true);
    try {
      await result;
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Pressable
      className={`${flex ? 'flex-1 ' : ''}flex-row items-center justify-center gap-2 ${compact ? 'px-3 py-2' : 'px-4 py-2.5'} rounded-xl border ${inactive ? 'border-gray-700 bg-gray-800 opacity-60' : 'border-teal-700 bg-teal-900/40'}`}
      onPress={handlePress}
      disabled={inactive}
    >
      {busy ? (
        <ActivityIndicator size="small" color="#2dd4bf" />
      ) : glyph ? (
        <Text className="text-lg">{glyph}</Text>
      ) : (
        <Ionicons name={icon} size={14} color="#2dd4bf" />
      )}
      <Text className="text-teal-400 text-sm font-medium">{label}</Text>
    </Pressable>
  );
}
