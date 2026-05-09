/**
 * Theme tokens for the coda TUI.
 * Uses RGB strings consumable by Ink's `color` / `backgroundColor` props.
 */

export type ThemeName = "dark" | "light";

export type Theme = {
  brand: string;
  brandDim: string;
  text: string;
  inverseText: string;
  subtle: string;
  inactive: string;
  suggestion: string;
  permission: string;
  planMode: string;
  bashBorder: string;
  promptBorder: string;
  success: string;
  error: string;
  warning: string;
  diffAdded: string;
  diffRemoved: string;
  diffAddedDimmed: string;
  diffRemovedDimmed: string;
  userMessageBg: string;
  selectionBg: string;
  background: string;
};

const dark: Theme = {
  brand: "rgb(0,109,221)",
  brandDim: "rgb(47,75,104)",
  text: "rgb(242,250,255)",
  inverseText: "rgb(3,7,16)",
  subtle: "rgb(47,75,104)",
  inactive: "rgb(64,102,141)",
  suggestion: "rgb(127,200,255)",
  permission: "rgb(127,200,255)",
  planMode: "rgb(227,255,143)",
  bashBorder: "rgb(136,82,112)",
  promptBorder: "rgb(0,109,221)",
  success: "rgb(227,255,143)",
  error: "rgb(251,176,165)",
  warning: "rgb(251,176,165)",
  diffAdded: "rgb(46,57,0)",
  diffRemoved: "rgb(99,70,67)",
  diffAddedDimmed: "rgb(22,31,52)",
  diffRemovedDimmed: "rgb(68,30,51)",
  userMessageBg: "rgb(13,19,34)",
  selectionBg: "rgb(0,109,221)",
  background: "rgb(3,7,16)",
};

const light: Theme = {
  brand: "rgb(0,109,221)",
  brandDim: "rgb(47,75,104)",
  text: "rgb(3,7,16)",
  inverseText: "rgb(242,250,255)",
  subtle: "rgb(47,75,104)",
  inactive: "rgb(64,102,141)",
  suggestion: "rgb(0,109,221)",
  permission: "rgb(64,102,141)",
  planMode: "rgb(110,137,0)",
  bashBorder: "rgb(136,82,112)",
  promptBorder: "rgb(0,109,221)",
  success: "rgb(110,137,0)",
  error: "rgb(99,70,67)",
  warning: "rgb(251,176,165)",
  diffAdded: "rgb(227,255,143)",
  diffRemoved: "rgb(248,232,230)",
  diffAddedDimmed: "rgb(246,255,219)",
  diffRemovedDimmed: "rgb(248,232,230)",
  userMessageBg: "rgb(229,244,255)",
  selectionBg: "rgb(180,213,255)",
  background: "rgb(242,250,255)",
};

const themes: Record<ThemeName, Theme> = { dark, light };

let activeTheme: ThemeName = "dark";

export function setTheme(name: ThemeName): void {
  activeTheme = name;
}

export function getTheme(): Theme {
  return themes[activeTheme];
}

export function themeColor(token: keyof Theme): string {
  return themes[activeTheme][token];
}
