import { ActivityIndicator, Animated, View } from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';

type Props = {
  animValue: Animated.Value;
  top: number;
};

export function RefreshIndicator({ animValue, top }: Props) {
  const colors = useThemeColors();
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        zIndex: 9,
        alignItems: 'center',
        opacity: animValue,
        transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
      }}
    >
      <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    </Animated.View>
  );
}
