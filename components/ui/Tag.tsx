import { Pressable, Text, View } from 'react-native';

type Props = {
  label: string;
  onRemove?: () => void;
};

export function Tag({ label, onRemove }: Props) {
  return (
    <View className="flex-row items-center bg-surface-2 rounded-full px-3 py-1 mr-2 mb-2">
      <Text className="text-foreground text-sm">{label}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} className="ml-2">
          <Text className="text-muted text-sm leading-none">×</Text>
        </Pressable>
      )}
    </View>
  );
}
