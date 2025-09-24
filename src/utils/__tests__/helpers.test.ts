import { describe, it, expect, vi } from 'vitest';
import { nowTime, modelOptions } from '../helpers.js';

describe('helpers', () => {
  it('nowTime delegates to toLocaleTimeString with hour/minute formatting', () => {
    const spy = vi.spyOn(Date.prototype as any, 'toLocaleTimeString').mockReturnValue('07:45');
    expect(nowTime()).toBe('07:45');
    spy.mockRestore();
  });

  it('modelOptions has valid invariants', () => {
    expect(modelOptions.length).toBeGreaterThan(0);

    const ids = new Set<number>();
    const allowedEffort = new Set(['low', 'medium', 'high']);
    for (const m of modelOptions) {
      expect(typeof m.label).toBe('string');
      expect(m.label.length).toBeGreaterThan(0);

      expect(typeof m.id).toBe('number');
      expect(ids.has(m.id)).toBe(false);
      ids.add(m.id);

      expect(allowedEffort.has(m.effort)).toBe(true);

      expect(typeof m.name).toBe('string');
      expect(m.name.includes('/')).toBe(true);
      const parts = m.name.split('/');
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    }
  });
});

