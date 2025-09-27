import { describe, it, expect } from 'vitest';
import {
  listFilesTool,
  readFileTool,
  writeFileTool,
  deleteFileTool,
  shellCommandTool,
  applyDiffTool
} from '../tools.js';

const getToolSchema = (tool: any) => tool.schema;

describe('Tool Schema Validation', () => {
  describe('listFilesTool', () => {
    const schema = getToolSchema(listFilesTool);

    it('should validate a correct path object', () => {
      const data = { path: 'some/directory' };
      expect(() => schema.parse(data)).not.toThrow();
    });

    it('should throw an error for a missing path', () => {
      expect(() => schema.parse({})).toThrow();
    });
  });

  describe('readFileTool', () => {
    const schema = getToolSchema(readFileTool);

    it('should validate a correct path object', () => {
      const data = { path: 'file.txt' };
      expect(() => schema.parse(data)).not.toThrow();
    });

    it('should throw an error for a missing path', () => {
      expect(() => schema.parse({})).toThrow();
    });
  });

  describe('writeFileTool', () => {
    const schema = getToolSchema(writeFileTool);

    it('should validate a correct path and content object', () => {
      const data = { path: 'file.txt', content: 'hello world' };
      expect(() => schema.parse(data)).not.toThrow();
    });

    it('should throw an error for a missing path', () => {
      expect(() => schema.parse({ content: 'hello world' })).toThrow();
    });

    it('should throw an error for a missing content', () => {
      expect(() => schema.parse({ path: 'file.txt' })).toThrow();
    });
  });

  describe('deleteFileTool', () => {
    const schema = getToolSchema(deleteFileTool);

    it('should validate a correct path object', () => {
      const data = { path: 'file.txt' };
      expect(() => schema.parse(data)).not.toThrow();
    });

    it('should throw an error for a missing path', () => {
      expect(() => schema.parse({ someOtherKey: 'value' })).toThrow();
    });
  });

  describe('shellCommandTool', () => {
    const schema = getToolSchema(shellCommandTool);

    it('should validate a correct command object', () => {
      const data = { command: 'ls -la' };
      expect(() => schema.parse(data)).not.toThrow();
    });

    it('should throw an error for a missing command', () => {
      expect(() => schema.parse({})).toThrow();
    });
  });

  describe('applyDiffTool', () => {
    const schema = getToolSchema(applyDiffTool);

    it('should validate a correct path and diff object', () => {
      const data = { path: 'file.txt', diff: '...' };
      expect(() => schema.parse(data)).not.toThrow();
    });

    it('should throw an error for a missing path', () => {
      expect(() => schema.parse({ diff: '...' })).toThrow();
    });

    it('should throw an error for a missing diff', () => {
      expect(() => schema.parse({ path: 'file.txt' })).toThrow();
    });
  });
});