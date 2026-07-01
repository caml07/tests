import { useWindowDimensions } from 'react-native';
import * as Device from 'expo-device';
import { BREAKPOINTS } from '@/src/shared/utils/breakpoints';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;

  const isTablet = Device.deviceType === Device.DeviceType.TABLET
    || Device.deviceType == null && width >= BREAKPOINTS.tablet

  const isPhone = !isTablet;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isCollapsed = isTablet && width < BREAKPOINTS.desktop;
  const screenWidth = width;
  const screenHeight = height;

  return {
    isTablet,
    isLandscape,
    isPhone,
    isDesktop,
    isCollapsed,
    screenWidth,
    screenHeight,
  };
}
