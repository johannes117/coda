// Stub: the vendored renderer only calls logForDebugging for verbose tracing.
export type DebugLogLevel = "debug" | "info" | "warn" | "error";

export function logForDebugging(
  _message: string,
  _opts: { level: DebugLogLevel } = { level: "debug" },
): void {}
