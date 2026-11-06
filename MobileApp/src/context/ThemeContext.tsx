import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {Appearance, ColorSchemeName, StatusBarStyle} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  cardBg: string;
  cardTopBg: string;
  headerBg: string;
  headerBorder: string;
  headerButtonBg: string;
  surfaceMuted: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderColor: string;
  borderLight: string;
  inputBg: string;
  inputBorder: string;
  inputDisabledBg: string;
  inputDisabledText: string;
  placeholderText: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  successBg: string;
  successBorder: string;
  successText: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;
  infoBg: string;
  infoBorder: string;
  infoText: string;
  modalOverlay: string;
  shadowColor: string;
}

export const lightColors: ThemeColors = {
  bg: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardTopBg: '#F1F5F9',
  headerBg: '#FFFFFF',
  headerBorder: '#E2E8F0',
  headerButtonBg: '#F1F5F9',
  surfaceMuted: '#F1F5F9',
  textPrimary: '#102A43',
  textSecondary: '#627D98',
  textMuted: '#829AB1',
  border: '#E2E8F0',
  borderColor: '#E2E8F0',
  borderLight: '#F0F4F8',
  inputBg: '#FFFFFF',
  inputBorder: '#D9E2EC',
  inputDisabledBg: '#F8FAFC',
  inputDisabledText: '#829AB1',
  placeholderText: '#829AB1',
  primary: '#1769E0',
  primaryHover: '#1254B7',
  primaryLight: '#EAF2FD',
  successBg: '#DEF7EC',
  successBorder: '#31C48D',
  successText: '#03543F',
  errorBg: '#FEE2E2',
  errorBorder: '#F87171',
  errorText: '#991B1B',
  warningBg: '#FEF3C7',
  warningBorder: '#F59E0B',
  warningText: '#92400E',
  infoBg: '#E0F2FE',
  infoBorder: '#38BDF8',
  infoText: '#0369A1',
  modalOverlay: 'rgba(0, 0, 0, 0.45)',
  shadowColor: '#000000',
};

export const darkColors: ThemeColors = {
  bg: '#0F172A',
  cardBg: '#1E293B',
  cardTopBg: '#283548',
  headerBg: '#1E293B',
  headerBorder: '#334155',
  headerButtonBg: '#334155',
  surfaceMuted: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  border: '#334155',
  borderColor: '#334155',
  borderLight: '#1E293B',
  inputBg: '#0F172A',
  inputBorder: '#334155',
  inputDisabledBg: '#1E293B',
  inputDisabledText: '#64748B',
  placeholderText: '#64748B',
  primary: '#1769E0',
  primaryHover: '#1254B7',
  primaryLight: '#1E3A8A',
  successBg: '#064E3B',
  successBorder: '#059669',
  successText: '#A7F3D0',
  errorBg: '#7F1D1D',
  errorBorder: '#DC2626',
  errorText: '#FECACA',
  warningBg: '#78350F',
  warningBorder: '#D97706',
  warningText: '#FDE68A',
  infoBg: '#0C4A6E',
  infoBorder: '#0284C7',
  infoText: '#BAE6FD',
  modalOverlay: 'rgba(0, 0, 0, 0.75)',
  shadowColor: '#000000',
};

const THEME_STORAGE_KEY = '@app_theme_preference';

interface ThemeContextType {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  statusBarStyle: StatusBarStyle;
  theme: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  themePreference: 'system',
  setThemePreference: async () => {},
  resolvedTheme: 'light',
  isDark: false,
  statusBarStyle: 'dark-content',
  theme: lightColors,
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() ?? 'light',
  );

  // Listen to system appearance changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setSystemScheme(colorScheme ?? 'light');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Restore saved preference on app launch
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemePreferenceState(saved);
        }
      } catch (err) {
        console.warn('Failed to load theme preference from storage:', err);
      }
    };

    loadThemePreference();
  }, []);

  // Update & persist preference
  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch (err) {
      console.warn('Failed to persist theme preference:', err);
    }
  }, []);

  // Compute resolved theme
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (themePreference === 'light') {
      return 'light';
    }
    if (themePreference === 'dark') {
      return 'dark';
    }
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [themePreference, systemScheme]);

  const isDark = resolvedTheme === 'dark';
  const theme = isDark ? darkColors : lightColors;
  const statusBarStyle: StatusBarStyle = isDark ? 'light-content' : 'dark-content';

  const contextValue = useMemo(
    () => ({
      themePreference,
      setThemePreference,
      resolvedTheme,
      isDark,
      statusBarStyle,
      theme,
    }),
    [themePreference, setThemePreference, resolvedTheme, isDark, statusBarStyle, theme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);

export default ThemeContext;
