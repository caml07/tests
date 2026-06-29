import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export const useScreenOrientation = () => {
  useEffect(() => {
    ScreenOrientation.unlockAsync();
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);
};
