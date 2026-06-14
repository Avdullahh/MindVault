import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../context/ThemeContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IoniconsName;
};

export function EmptyState({ title, subtitle, actionLabel, onAction, icon = 'compass-outline' }: Props) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className="w-16 h-16 rounded-full bg-surface border border-border items-center justify-center mb-4">
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text className="font-rounded text-lg font-bold text-primary mb-2 text-center">{title}</Text>
      {subtitle && <Text className="font-rounded italic text-muted text-center text-sm leading-5 mb-6">{subtitle}</Text>}
      {actionLabel && onAction && (
        <Pressable className="bg-primary rounded-xl px-6 py-3 border border-primary" onPress={onAction}>
          <Text className="text-foreground font-semibold">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
