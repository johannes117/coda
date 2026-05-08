import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  detectAndRegisterImages,
  pruneImages,
  buildHumanMessageWithImages,
  type ImageRef,
} from '../image-paste.js';

let tmpDir: string;
let pngPath: string;
let pngWithSpacePath: string;
let jpgPath: string;

// 1x1 transparent PNG
const PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6300010000000500010d0a2db40000000049454e44ae426082',
  'hex'
);

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'coda-img-test-'));
  pngPath = path.join(tmpDir, 'a.png');
  pngWithSpacePath = path.join(tmpDir, 'spaced name.png');
  jpgPath = path.join(tmpDir, 'b.jpg');
  await fs.writeFile(pngPath, PNG_BYTES);
  await fs.writeFile(pngWithSpacePath, PNG_BYTES);
  await fs.writeFile(jpgPath, PNG_BYTES);
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function freshState() {
  return {
    images: new Map<number, ImageRef>(),
    nextIndex: { current: 1 },
  };
}

describe('detectAndRegisterImages', () => {
  it('replaces a plain absolute image path with [Image #1]', async () => {
    const { images, nextIndex } = freshState();
    const out = await detectAndRegisterImages(
      `please describe ${pngPath}`,
      images,
      nextIndex
    );
    expect(out).toBe('please describe [Image #1]');
    expect(images.size).toBe(1);
    expect(images.get(1)?.absPath).toBe(pngPath);
  });

  it('handles single-quoted paths with spaces (iTerm2 style)', async () => {
    const { images, nextIndex } = freshState();
    const out = await detectAndRegisterImages(
      `look '${pngWithSpacePath}' here`,
      images,
      nextIndex
    );
    expect(out).toBe('look [Image #1] here');
    expect(images.get(1)?.absPath).toBe(pngWithSpacePath);
  });

  it('handles backslash-escaped spaces (macOS Terminal style)', async () => {
    const { images, nextIndex } = freshState();
    const escaped = pngWithSpacePath.replace(/ /g, '\\ ');
    const out = await detectAndRegisterImages(
      `compare ${escaped}`,
      images,
      nextIndex
    );
    expect(out).toBe('compare [Image #1]');
    expect(images.get(1)?.absPath).toBe(pngWithSpacePath);
  });

  it('registers multiple images with incrementing indices', async () => {
    const { images, nextIndex } = freshState();
    const out = await detectAndRegisterImages(
      `diff ${pngPath} vs ${jpgPath}`,
      images,
      nextIndex
    );
    expect(out).toBe('diff [Image #1] vs [Image #2]');
    expect(images.size).toBe(2);
  });

  it('does not replace non-existent image paths', async () => {
    const { images, nextIndex } = freshState();
    const out = await detectAndRegisterImages(
      'check /tmp/does-not-exist-xyz.png please',
      images,
      nextIndex
    );
    expect(out).toBe('check /tmp/does-not-exist-xyz.png please');
    expect(images.size).toBe(0);
  });

  it('does not touch text without image extensions', async () => {
    const { images, nextIndex } = freshState();
    const out = await detectAndRegisterImages(
      'just a normal prompt with no images',
      images,
      nextIndex
    );
    expect(out).toBe('just a normal prompt with no images');
    expect(images.size).toBe(0);
  });
});

describe('pruneImages', () => {
  it('drops entries whose placeholder is no longer present', () => {
    const images = new Map<number, ImageRef>([
      [1, { index: 1, absPath: '/x.png', originalToken: '/x.png' }],
      [2, { index: 2, absPath: '/y.png', originalToken: '/y.png' }],
    ]);
    pruneImages('only [Image #2] left', images);
    expect(images.has(1)).toBe(false);
    expect(images.has(2)).toBe(true);
  });
});

describe('buildHumanMessageWithImages', () => {
  it('returns plain text message when no images attached', async () => {
    const msg = await buildHumanMessageWithImages('hello', new Map());
    expect(msg.content).toBe('hello');
  });

  it('builds multipart content with image_url parts', async () => {
    const images = new Map<number, ImageRef>([
      [1, { index: 1, absPath: pngPath, originalToken: pngPath }],
    ]);
    const msg = await buildHumanMessageWithImages(
      'describe [Image #1]',
      images
    );
    expect(Array.isArray(msg.content)).toBe(true);
    const parts = msg.content as any[];
    expect(parts[0]).toEqual({ type: 'text', text: 'describe [Image #1]' });
    expect(parts[1].type).toBe('image_url');
    expect(parts[1].image_url.url).toMatch(/^data:image\/png;base64,/);
  });

  it('orders image parts by index', async () => {
    const images = new Map<number, ImageRef>([
      [2, { index: 2, absPath: jpgPath, originalToken: jpgPath }],
      [1, { index: 1, absPath: pngPath, originalToken: pngPath }],
    ]);
    const msg = await buildHumanMessageWithImages('a [Image #1] [Image #2]', images);
    const parts = msg.content as any[];
    expect(parts[1].image_url.url).toMatch(/^data:image\/png/);
    expect(parts[2].image_url.url).toMatch(/^data:image\/jpeg/);
  });
});
