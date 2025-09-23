// src/theme.ts
export const tokyoNightTheme = {
  light: {
    bg: '#e6e7ed',
    bgSecondary: '#d6d8df',
    text: '#343b59',
    textMuted: '#888b94',
    border: '#c1c2c7',
    primary: '#65359d',
    accent: '#006c86',
    string: '#385f0d',
    keyword: '#65359d',
    function: '#2959aa',
    comment: '#888b94',
    operator: '#006C86',
    number: '#965027',
    builtin: '#006c86',
    error: '#8c4351',
  },
  dark: {
    bg: '#24283b',
    bgSecondary: '#1f2335',
    bgTertiary: '#2c324a',
    border: '#1b1e2e',
    text: '#a9b1d6',
    textMuted: '#8089b3',
    textComment: '#5f6996',
    primary: '#7aa2f7',
    accent: '#bb9af7',
    string: '#9ece6a',
    keyword: '#bb9af7',
    function: '#7aa2f7',
    operator: '#89ddff',
    number: '#ff9e64',
    builtin: '#2ac3de',
    error: '#f7768e',
  },
  light: {
    bg: '#e6e7ed',
    bgSecondary: '#d6d8df',
    bgTertiary: '#d6d8df',
    border: '#c1c2c7',
    text: '#343b59',
    textMuted: '#888b94',
    textComment: '#888b94',
    primary: '#65359d',
    accent: '#006c86',
    string: '#385f0d',
    keyword: '#65359d',
    function: '#2959aa',
    operator: '#006C86',
    number: '#965027',
    builtin: '#006c86',
    error: '#8c4351',
  }
} as const;

export type TokyoNightColorScheme = typeof tokyoNightTheme;

/**
 * Get Tokyo Night colors based on theme
 */
export const getTokyoNightColors = (isDark: boolean) => {
  return isDark ? tokyoNightTheme.dark : tokyoNightTheme.light;
};