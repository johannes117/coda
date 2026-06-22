import { PassThrough } from "stream";
import stripAnsi from "strip-ansi";
import type { ReactNode } from "react";
import { render } from "ink";

const SYNC_START = "\x1B[?2026h";
const SYNC_END = "\x1B[?2026l";

// Test replacement for ink-testing-library's `lastFrame()`, which targets stock
// Ink. The vendored renderer emits a full frame per commit to a non-TTY stream;
// we capture writes, take the last complete frame (DEC-sync-delimited when
// present), and strip ANSI so tests can assert on plain text.
export async function renderToString(
  node: ReactNode,
  columns = 80,
): Promise<string> {
  const stream = new PassThrough() as unknown as NodeJS.WriteStream;
  (stream as unknown as { columns: number; rows: number }).columns = columns;
  (stream as unknown as { columns: number; rows: number }).rows = 24;

  let output = "";
  stream.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });

  const instance = render(node, {
    stdout: stream,
    stdin: new PassThrough() as unknown as NodeJS.ReadStream,
    patchConsole: false,
    exitOnCtrlC: false,
  });
  await new Promise((resolve) => setTimeout(resolve, 200));
  instance.unmount();

  // The renderer wraps each committed frame in DEC synchronized-update markers.
  // unmount() appends a blank cleanup frame, so take the last frame whose
  // stripped content is non-empty (the final rendered state).
  let idx = 0;
  const frames: string[] = [];
  for (;;) {
    const start = output.indexOf(SYNC_START, idx);
    if (start === -1) break;
    const end = output.indexOf(SYNC_END, start);
    if (end === -1) break;
    frames.push(stripAnsi(output.slice(start + SYNC_START.length, end)));
    idx = end + SYNC_END.length;
  }

  const nonEmpty = frames.filter((f) => f.trim().length > 0);
  if (nonEmpty.length > 0) return nonEmpty[nonEmpty.length - 1]!;
  return stripAnsi(output);
}
