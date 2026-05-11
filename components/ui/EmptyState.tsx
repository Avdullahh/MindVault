import { Pressable, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-xl font-bold text-teal-400 mb-2 text-center">{title}</Text>
      {subtitle && <Text className="text-gray-400 text-center mb-6">{subtitle}</Text>}
      {actionLabel && onAction && (
        <Pressable className="bg-teal-500 rounded-xl px-6 py-3" onPress={onAction}>
          <Text className="text-white font-semibold">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
