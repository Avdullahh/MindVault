import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: IoniconsName;
};

export function EmptyState({ title, subtitle, actionLabel, onAction, icon = 'compass-outline' }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className="w-16 h-16 rounded-full bg-leather-800 border border-leather-600 items-center justify-center mb-4">
        <Ionicons name={icon} size={28} color="#7a5608" />
      </View>
      <Text className="text-lg font-bold text-gold-400 mb-2 text-center" style={{ fontFamily: 'Georgia' }}>{title}</Text>
      {subtitle && <Text className="text-leather-300 text-center text-sm leading-5 mb-6">{subtitle}</Text>}
      {actionLabel && onAction && (
        <Pressable className="bg-gold-500 rounded-xl px-6 py-3" onPress={onAction}>
          <Text className="text-leather-50 font-semibold">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
