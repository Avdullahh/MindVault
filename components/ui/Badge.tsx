import { Text, View } from 'react-native';

type Color = 'teal' | 'gray' | 'red' | 'yellow';

const colorMap: Record<Color, { bg: string; text: string }> = {
  teal:   { bg: 'bg-teal-900',   text: 'text-teal-300'   },
  gray:   { bg: 'bg-gray-700',   text: 'text-gray-300'   },
  red:    { bg: 'bg-red-900',    text: 'text-red-300'    },
  yellow: { bg: 'bg-yellow-900', text: 'text-yellow-300' },
};

type Props = {
  label: string;
  color?: Color;
};

export function Badge({ label, color = 'gray' }: Props) {
  const { bg, text } = colorMap[color];
  return (
    <View className={`${bg} rounded-full px-3 py-1 self-start`}>
      <Text className={`${text} text-xs font-medium`}>{label}</Text>
    </View>
  );
}
