// Vendored fork of Ink (from Claude Code) with a cell-diffing, scrollback-aware
// renderer. Aliased as "ink" via tsconfig/vitest so existing import sites are
// unchanged. Box/Text are the theme-agnostic base components (coda resolves its
// own colors), so the design-system ThemeProvider layer is intentionally skipped.
export { renderSync as render, createRoot } from "./ink/root.js";
export type { Instance, RenderOptions, Root } from "./ink/root.js";

export { default as Box } from "./ink/components/Box.js";
export type { Props as BoxProps } from "./ink/components/Box.js";
export { default as Text } from "./ink/components/Text.js";
export type { Props as TextProps } from "./ink/components/Text.js";
export { default as Spacer } from "./ink/components/Spacer.js";
export { default as Newline } from "./ink/components/Newline.js";

export { default as useInput } from "./ink/hooks/use-input.js";
export { default as useApp } from "./ink/hooks/use-app.js";
export { default as useStdin } from "./ink/hooks/use-stdin.js";

export type { Key } from "./ink/events/input-event.js";
