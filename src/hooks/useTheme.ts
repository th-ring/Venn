import { useState, useEffect } from 'react';
import {
  ThemePreference,
  ResolvedTheme,
  getThemePreference,
  getResolvedTheme,
  setThemePreference as setServiceThemePreference,
  subscribeTheme,
  initTheme,
} from '../services/themeService';

export interface UseThemeReturn {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const [themePreference, setLocalPreference] = useState<ThemePreference>(() => getThemePreference());
  const [resolvedTheme, setLocalResolvedTheme] = useState<ResolvedTheme>(() => getResolvedTheme());

  useEffect(() => {
    // Ensure initial theme is synced
    const cleanupInit = initTheme();

    const unsubscribe = subscribeTheme((newResolved, newPref) => {
      setLocalResolvedTheme(newResolved);
      setLocalPreference(newPref);
    });

    return () => {
      cleanupInit();
      unsubscribe();
    };
  }, []);

  const setTheme = (pref: ThemePreference) => {
    const nextResolved = setServiceThemePreference(pref);
    setLocalPreference(pref);
    setLocalResolvedTheme(nextResolved);
  };

  const toggleTheme = () => {
    // Toggles light -> dark -> system -> light
    if (themePreference === 'light') {
      setTheme('dark');
    } else if (themePreference === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return {
    themePreference,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    setThemePreference: setTheme,
    toggleTheme,
  };
}
