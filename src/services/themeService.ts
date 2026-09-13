export type ThemePreference = 'system' | 'light' | 'dark';

export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'living_area_theme';

type ThemeChangeListener = (theme: ResolvedTheme, preference: ThemePreference) => void;
const listeners = new Set<ThemeChangeListener>();

/**
 * Returns the stored theme preference or 'system' as default.
 */
export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (e) {
    console.warn('[themeService] Could not access localStorage', e);
  }
  return 'system';
}

/**
 * Resolves the effective theme ('light' or 'dark') given a preference.
 */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Returns currently active resolved theme ('light' | 'dark').
 */
export function getResolvedTheme(): ResolvedTheme {
  return resolveTheme(getThemePreference());
}

/**
 * Applies the theme to the DOM (adds/removes 'dark' class on <html>).
 */
export function applyTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }
  listeners.forEach((listener) => {
    try {
      listener(resolved, preference);
    } catch (e) {
      console.error('[themeService] Error in theme listener', e);
    }
  });
  return resolved;
}

/**
 * Sets a new theme preference, persists it, and updates the DOM.
 */
export function setThemePreference(preference: ThemePreference): ResolvedTheme {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch (e) {
    console.warn('[themeService] Could not save to localStorage', e);
  }
  return applyTheme(preference);
}

/**
 * Subscribes to theme changes.
 */
export function subscribeTheme(listener: ThemeChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Initializes the theme on application bootstrap and attaches system media-query listener.
 */
export function initTheme(): () => void {
  const initialPref = getThemePreference();
  applyTheme(initialPref);

  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleMediaChange = () => {
    if (getThemePreference() === 'system') {
      applyTheme('system');
    }
  };

  try {
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  } catch {
    // Fallback for older browsers
    mediaQuery.addListener(handleMediaChange);
    return () => mediaQuery.removeListener(handleMediaChange);
  }
}
