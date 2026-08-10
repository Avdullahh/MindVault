import { Pressable, Text, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  action?: string;
  onPress?: () => void;
};

export function SectionHeader({ title, action, onPress }: SectionHeaderProps) {
  return (
    <View className="h-9 flex-row items-center justify-between mb-2">
      <Text
        className="text-muted text-xs font-semibold uppercase leading-4"
        style={{ letterSpacing: 2, includeFontPadding: false }}
      >
        {title}
      </Text>
      {action && onPress ? (
        <Pressable className="h-9 pl-4 items-center justify-center" onPress={onPress}>
          <Text className="text-primary text-sm font-medium leading-5" style={{ includeFontPadding: false }}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
