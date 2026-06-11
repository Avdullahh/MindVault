import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, Vibration, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../context/ThemeContext';

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
  const colors = useThemeColors();
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
        className={`flex-row min-h-11 items-center justify-center gap-2 ${compact ? 'px-3 py-2' : 'px-4 py-2.5'} rounded-xl border ${inactive ? 'border-border bg-surface opacity-60' : 'border-primary bg-primary/20'}`}
        onPress={handlePress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy }}
        hitSlop={compact ? 6 : undefined}
      >
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : glyph ? (
          <Text className="text-lg">{glyph}</Text>
        ) : (
          <Ionicons name={icon} size={14} color={colors.primary} />
        )}
        <Text className="text-primary text-sm font-medium">{label}</Text>
      </Pressable>
      {hint ? <Text className="text-muted text-xs text-center mt-1.5 px-1">{hint}</Text> : null}
    </View>
  );
}
