import { Platform, useWindowDimensions } from 'react-native';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isIPad = Platform.OS === 'ios' && Platform.isPad;
  const isLandscape = width > height;
  return { isIPad, isLandscape, width, height };
}
