import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type EntityCardProps = {
  title: string;
  subtitle?: string | null;
  footer?: string | null;
  onPress: () => void;
  meta?: ReactNode;
};

export function EntityCard({ title, subtitle, footer, onPress, meta }: EntityCardProps) {
  return (
    <Pressable
      className="bg-surface rounded-2xl p-4 mb-3 border border-border"
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text className="text-foreground font-normal font-rounded text-base mb-1" numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-muted text-sm mb-2 font-rounded italic" numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
      {meta ? <View className="flex-row gap-2 flex-wrap mt-1">{meta}</View> : null}
      {footer ? (
        <Text className="text-muted text-xs font-rounded italic mt-1" numberOfLines={1}>
          {footer}
        </Text>
      ) : null}
    </Pressable>
  );
}
