import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  listFilesTool,
  readFileTool,
  writeFileTool,
  deleteFileTool,
  shellCommandTool,
} from '../tools.js';

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = path.join(process.cwd(), `.tmp-tools-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  try {
    return await fn(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

describe('Agent Tools - functional behavior', () => {
  it('lists files with directories suffixed by slash', async () => {
    await withTempDir(async (dir) => {
      await fs.writeFile(path.join(dir, 'file1.txt'), 'hello', 'utf8');
      await fs.mkdir(path.join(dir, 'subdir'));
      const output = await listFilesTool.func({ path: dir } as any);
      const entries = output.split('\n').filter(Boolean);
      expect(new Set(entries)).toEqual(new Set(['file1.txt', 'subdir/']));
    });
  });

  it('reads file content and reports ENOENT error', async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, 'readme.txt');
      await fs.writeFile(file, 'content', 'utf8');
      const ok = await readFileTool.func({ path: file } as any);
      expect(ok).toBe('content');
      const missing = await readFileTool.func({ path: path.join(dir, 'missing.txt') } as any);
      expect(String(missing)).toMatch(/^Error reading file:/);
    });
  });

  it('writes file and returns diff info; idempotent on same content', async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, 'data.txt');
      const first = await writeFileTool.func({ path: file, content: 'a\nb' } as any);
      const firstParsed = JSON.parse(String(first));
      // New file: implementation counts one empty-line removal from initial ''
      expect(firstParsed.summary).toBe(`Updated ${file} with 2 addition(s) and 1 removal(s).`);
      expect(Array.isArray(firstParsed.diffLines)).toBe(true);
      expect(await fs.readFile(file, 'utf8')).toBe('a\nb');

      const second = await writeFileTool.func({ path: file, content: 'a\nb' } as any);
      const secondParsed = JSON.parse(String(second));
      expect(secondParsed.summary).toBe(`No changes made to ${file}.`);
      expect(secondParsed.diffLines).toEqual([]);
    });
  });

  it('deletes existing file and reports error on missing', async () => {
    await withTempDir(async (dir) => {
      const file = path.join(dir, 'to-delete.txt');
      await fs.writeFile(file, 'x', 'utf8');
      const ok = await deleteFileTool.func({ path: file } as any);
      expect(ok).toBe(`Successfully deleted ${file}`);
      const again = await deleteFileTool.func({ path: file } as any);
      expect(String(again)).toMatch(/^Error deleting file:/);
    });
  });

  it('executes a simple shell command and returns STDOUT', async () => {
    const result = await shellCommandTool.func({ command: 'echo hello' } as any);
    expect(String(result)).toContain('STDOUT:');
    expect(String(result)).toContain('hello');
  });
});
