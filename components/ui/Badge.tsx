import { Text, View } from 'react-native';

type Color = 'teal' | 'gray' | 'red' | 'yellow';

const colorMap: Record<Color, { bg: string; text: string }> = {
  teal:   { bg: 'bg-primary/20',   text: 'text-primary'      },
  gray:   { bg: 'bg-surface-2',    text: 'text-foreground'   },
  red:    { bg: 'bg-destructive/20', text: 'text-destructive' },
  yellow: { bg: 'bg-yellow-900',   text: 'text-yellow-300'   },
};

type Props = {
  label: string;
  color?: Color;
};

export function Badge({ label, color = 'gray' }: Props) {
  const { bg, text } = colorMap[color];
  return (
    <View className={`${bg} rounded-full px-3 py-1 self-start`}>
      <Text className={`font-rounded ${text} text-xs font-medium`}>{label}</Text>
    </View>
  );
}
