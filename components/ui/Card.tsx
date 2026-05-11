import { Pressable, View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  onPress?: () => void;
  children: React.ReactNode;
};

export function Card({ onPress, children, className = '', ...rest }: Props) {
  const base = `bg-gray-800 rounded-2xl p-4 ${className}`;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={base} {...(rest as object)}>
        {children}
      </Pressable>
    );
  }

  return (
    <View className={base} {...rest}>
      {children}
    </View>
  );
}
