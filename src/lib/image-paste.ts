import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { HumanMessage } from '@langchain/core/messages';

export type ImageRef = {
  /** 1-based index shown to the user (e.g. [Image #1]) */
  index: number;
  /** Resolved absolute path on disk. */
  absPath: string;
  /** The exact substring originally pasted, for debugging. */
  originalToken: string;
};

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'];
const EXT_GROUP = IMAGE_EXTS.join('|');

// Order matters: most-specific first.
// 1. Single-quoted:  '/path with spaces/foo.png'
// 2. Double-quoted:  "/path with spaces/foo.png"
// 3. Backslash-escaped: /path\ with\ spaces/foo.png  (macOS Terminal)
// 4. Plain:           /path/to/foo.png  or ./foo.png  or ~/foo.png  or foo.png
const QUOTED_SINGLE = new RegExp(`'([^']+\\.(?:${EXT_GROUP}))'`, 'i');
const QUOTED_DOUBLE = new RegExp(`"([^"]+\\.(?:${EXT_GROUP}))"`, 'i');
const ESCAPED = new RegExp(`((?:[^\\s]|\\\\ )+\\.(?:${EXT_GROUP}))`, 'i');
const PLAIN = new RegExp(`(\\S+\\.(?:${EXT_GROUP}))`, 'i');

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
};

function expandHome(p: string): string {
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function unescapeBackslashSpaces(p: string): string {
  return p.replace(/\\ /g, ' ');
}

function resolvePath(raw: string): string {
  const expanded = expandHome(raw);
  return path.isAbsolute(expanded)
    ? expanded
    : path.resolve(process.cwd(), expanded);
}

/**
 * Walk the given input value once, finding the first image-path token (if any).
 * Returns the matched substring and the cleaned (unquoted/unescaped) path.
 */
function findFirstImageToken(
  value: string
): { token: string; cleanedPath: string } | null {
  for (const re of [QUOTED_SINGLE, QUOTED_DOUBLE]) {
    const m = re.exec(value);
    if (m) return { token: m[0], cleanedPath: m[1] };
  }
  const esc = ESCAPED.exec(value);
  if (esc) {
    return { token: esc[0], cleanedPath: unescapeBackslashSpaces(esc[1]) };
  }
  const plain = PLAIN.exec(value);
  if (plain) return { token: plain[0], cleanedPath: plain[1] };
  return null;
}

/**
 * Mutates `images` in-place: any image-path tokens found in `value` are replaced
 * with `[Image #N]` placeholders and registered in the map. Returns the rewritten
 * string. If a path doesn't exist, it is left untouched (so misspellings remain
 * visible to the user).
 *
 * The function intentionally checks file existence synchronously via fs.statSync
 * to keep the onChange handler simple — image files are typically small to stat.
 */
export async function detectAndRegisterImages(
  value: string,
  images: Map<number, ImageRef>,
  nextIndexRef: { current: number }
): Promise<string> {
  let working = value;
  // Loop until no more new image tokens are found. Each iteration replaces one.
  // Bound iterations to avoid pathological inputs.
  for (let i = 0; i < 16; i++) {
    const found = findFirstImageToken(working);
    if (!found) break;

    const absPath = resolvePath(found.cleanedPath);
    let exists = false;
    try {
      const stat = await fs.stat(absPath);
      exists = stat.isFile();
    } catch {
      exists = false;
    }
    if (!exists) {
      // Skip this token by replacing only this occurrence with itself + a zero-
      // width sentinel — but simpler: bail out so we don't infinite-loop.
      break;
    }

    const index = nextIndexRef.current++;
    images.set(index, {
      index,
      absPath,
      originalToken: found.token,
    });
    working = working.replace(found.token, `[Image #${index}]`);
  }
  return working;
}

/**
 * Drops entries from `images` whose `[Image #N]` placeholder no longer appears
 * in the current input value (e.g. user backspaced the placeholder out).
 */
export function pruneImages(
  value: string,
  images: Map<number, ImageRef>
): void {
  for (const idx of [...images.keys()]) {
    if (!value.includes(`[Image #${idx}]`)) images.delete(idx);
  }
}

function mimeFor(absPath: string): string {
  const ext = path.extname(absPath).slice(1).toLowerCase();
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

/**
 * Build a HumanMessage suitable for sending to the LLM. If `images` is empty,
 * returns a plain-text HumanMessage. Otherwise returns a multipart message
 * with text + image_url parts (data: URLs).
 */
export async function buildHumanMessageWithImages(
  text: string,
  images: Map<number, ImageRef>
): Promise<HumanMessage> {
  if (images.size === 0) return new HumanMessage(text);

  const imageParts: Array<{
    type: 'image_url';
    image_url: { url: string };
  }> = [];

  // Iterate in numeric order to match [Image #N] sequence.
  const ordered = [...images.values()].sort((a, b) => a.index - b.index);
  for (const ref of ordered) {
    try {
      const bytes = await fs.readFile(ref.absPath);
      const b64 = bytes.toString('base64');
      const dataUrl = `data:${mimeFor(ref.absPath)};base64,${b64}`;
      imageParts.push({ type: 'image_url', image_url: { url: dataUrl } });
    } catch {
      // Skip unreadable images silently; the placeholder remains in the text.
    }
  }

  return new HumanMessage({
    content: [{ type: 'text', text }, ...imageParts],
  });
}
