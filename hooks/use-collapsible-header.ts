import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export const HEADER_HEIGHT = 154;

export function useCollapsibleHeader(refetch: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshPaneAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(refreshPaneAnim, {
      toValue: isRefreshing ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isRefreshing]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true },
  );

  return { isRefreshing, handleRefresh, refreshPaneAnim, headerTranslateY, onScroll };
}
