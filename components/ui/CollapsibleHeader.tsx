import { Animated } from 'react-native';

type Props = {
  translateY: Animated.AnimatedInterpolation<number>;
  children: React.ReactNode;
};

export function CollapsibleHeader({ translateY, children }: Props) {
  return (
    <Animated.View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, transform: [{ translateY }] }}
      className="bg-background px-5 pt-14"
    >
      {children}
    </Animated.View>
  );
}
