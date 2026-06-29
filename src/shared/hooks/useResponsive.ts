import { useWindowDimensions, Platform } from 'react-native';
import * as Device from 'expo-device';
import { BREAKPOINTS } from '@/src/shared/utils/breakpoints';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState } from 'react';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const [orientationLockActive, setOrientationLockActive] = useState(false);

  useEffect(() => {
    const checkOrientationLock = async () => {
      const currentLock = await ScreenOrientation.getOrientationLockAsync();
      setOrientationLockActive(currentLock !== ScreenOrientation.OrientationLock.UNKNOWN);
    };
    checkOrientationLock();

    const subscription = ScreenOrientation.addOrientationChangeListener(() => {
      checkOrientationLock();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const isTabletByWidth = width >= BREAKPOINTS.tablet;
  const isTabletByDevice = Device.deviceType === Device.DeviceType.TABLET;
  const isTablet = isTabletByWidth || isTabletByDevice;
  const isLandscape = width > height;
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
    orientationLockActive,
  };
}
