import { describe, it, expect } from 'vitest';
import { buildDiffLines } from '../diff.js';

describe('buildDiffLines', () => {
  it('should handle additions, removals, and context correctly', () => {
    const original = [
      'line 1',
      'line 2',
      'line 3',
      'line 5',
    ];
    const updated = [
      'line 1',
      'line 3',
      'line 4',
      'line 5',
    ];

    const diff = buildDiffLines(original, updated);
    expect(diff).toEqual([
      { type: 'context', oldLine: 1, newLine: 1, text: 'line 1' },
      { type: 'remove', oldLine: 2, text: 'line 2' },
      { type: 'context', oldLine: 3, newLine: 2, text: 'line 3' },
      { type: 'add', newLine: 3, text: 'line 4' },
      { type: 'context', oldLine: 4, newLine: 4, text: 'line 5' },
    ]);
  });

  it('should handle empty original (all additions)', () => {
    const original: string[] = [];
    const updated = ['first line', 'second line'];
    const diff = buildDiffLines(original, updated);
    expect(diff).toEqual([
      { type: 'add', newLine: 1, text: 'first line' },
      { type: 'add', newLine: 2, text: 'second line' },
    ]);
  });

  it('should handle empty updated (all removals)', () => {
    const original = ['first line', 'second line'];
    const updated: string[] = [];
    const diff = buildDiffLines(original, updated);
    expect(diff).toEqual([
      { type: 'remove', oldLine: 1, text: 'first line' },
      { type: 'remove', oldLine: 2, text: 'second line' },
    ]);
  });

  it('should handle identical arrays', () => {
    const original = ['line 1', 'line 2', 'line 3'];
    const updated = ['line 1', 'line 2', 'line 3'];
    const diff = buildDiffLines(original, updated);
    expect(diff).toEqual([
      { type: 'context', oldLine: 1, newLine: 1, text: 'line 1' },
      { type: 'context', oldLine: 2, newLine: 2, text: 'line 2' },
      { type: 'context', oldLine: 3, newLine: 3, text: 'line 3' },
    ]);
  });

  it('should handle both arrays empty', () => {
    const original: string[] = [];
    const updated: string[] = [];
    const diff = buildDiffLines(original, updated);
    expect(diff).toEqual([]);
  });
});

