import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, Vibration, View } from 'react-native';
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
  hint?: string;
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
  hint,
}: Props) {
  const [internalLoading, setInternalLoading] = useState(false);
  const busy = loading ?? internalLoading;
  const inactive = disabled || busy;

  const handlePress = async () => {
    if (inactive) return;
    Vibration.vibrate(8);
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
    <View className={flex ? 'flex-1' : ''}>
      <Pressable
        className={`flex-row min-h-11 items-center justify-center gap-2 ${compact ? 'px-3 py-2' : 'px-4 py-2.5'} rounded-xl border ${inactive ? 'border-leather-600 bg-leather-800 opacity-60' : 'border-gold-700 bg-gold-900/40'}`}
        onPress={handlePress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy }}
        hitSlop={compact ? 6 : undefined}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#d4a017" />
        ) : glyph ? (
          <Text className="text-lg">{glyph}</Text>
        ) : (
          <Ionicons name={icon} size={14} color="#d4a017" />
        )}
        <Text className="text-gold-400 text-sm font-medium">{label}</Text>
      </Pressable>
      {hint ? <Text className="text-leather-400 text-xs text-center mt-1.5 px-1">{hint}</Text> : null}
    </View>
  );
}
