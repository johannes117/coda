import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { augmentPromptWithFiles } from '../promptAugmentation.js';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

const mockFs = vi.mocked(fs);

describe('augmentPromptWithFiles', () => {
  beforeEach(() => {
    mockFs.readFile.mockReset();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('returns original prompt when no @file references', async () => {
    const input = 'please help me with this code';
    const result = await augmentPromptWithFiles(input);
    expect(result).toBe(input);
    expect(mockFs.readFile).not.toHaveBeenCalled();
  });

  it('augments prompt with single file content', async () => {
    mockFs.readFile.mockResolvedValueOnce('console.log("hello");');

    const input = 'please refactor @src/index.ts';
    const result = await augmentPromptWithFiles(input);

    expect(mockFs.readFile).toHaveBeenCalledWith(
      expect.stringContaining('src/index.ts'),
      'utf-8'
    );
    expect(result).toContain('Content from src/index.ts:');
    expect(result).toContain('console.log("hello");');
    expect(result).toContain('User request: please refactor @src/index.ts');
  });

  it('handles multiple file references', async () => {
    mockFs.readFile
      .mockResolvedValueOnce('// config file')
      .mockResolvedValueOnce('// utils file');

    const input = 'compare @config.js and @utils.js';
    const result = await augmentPromptWithFiles(input);

    expect(mockFs.readFile).toHaveBeenCalledTimes(2);
    expect(result).toContain('Content from config.js:');
    expect(result).toContain('Content from utils.js:');
    expect(result).toContain('// config file');
    expect(result).toContain('// utils file');
  });

  it('handles file read errors gracefully', async () => {
    mockFs.readFile.mockRejectedValueOnce(new Error('File not found'));

    const input = 'please check @missing.ts';
    const result = await augmentPromptWithFiles(input);

    expect(result).toContain('Could not read file missing.ts');
    expect(result).toContain('Error: File not found');
    expect(result).toContain('User request: please check @missing.ts');
  });

  it('ignores @references inside backticks', async () => {
    const input = 'use `@file` syntax to reference files';
    const result = await augmentPromptWithFiles(input);

    expect(result).toBe(input);
    expect(mockFs.readFile).not.toHaveBeenCalled();
  });

  it('ignores @references that are part of words', async () => {
    const input = 'email me at user@file.com';
    const result = await augmentPromptWithFiles(input);

    expect(result).toBe(input);
    expect(mockFs.readFile).not.toHaveBeenCalled();
  });
});