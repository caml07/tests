import { useWindowDimensions, Platform } from 'react-native';
import * as Device from 'expo-device';
import { BREAKPOINTS } from '@/features/layout/constants/breakpoints';
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
      ScreenOrientation.removeOrientationChangeListeners(subscription);
    };
  }, []);

  const isTablet = Device.deviceType === Device.DeviceType.TABLET;
  const isLandscape = width > height;
  const isPhone = !isTablet;
  const screenWidth = width;
  const screenHeight = height;

  return {
    isTablet,
    isLandscape,
    isPhone,
    screenWidth,
    screenHeight,
    orientationLockActive,
  };
}
