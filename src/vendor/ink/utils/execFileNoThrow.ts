// Stub: only used by the OSC clipboard path (pbcopy/wl-copy/xclip/tmux). Always
// reporting failure makes the renderer fall back to OSC 52 escape-based copy.
type ExecResult = { code: number; stdout: string; stderr: string };

export function execFileNoThrow(
  _file: string,
  _args?: readonly string[],
  _opts?: unknown,
): Promise<ExecResult> {
  return Promise.resolve({ code: 1, stdout: "", stderr: "" });
}
