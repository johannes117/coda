import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const listFilesSchema = z.object({
  path: z.string().describe('The path of the directory to list.'),
});

const readFileSchema = z.object({
  path: z.string().describe('The path of the file to read.'),
});

const writeFileSchema = z.object({
  path: z.string().describe('The path of the file to write to.'),
  content: z.string().describe('The content to write to the file.'),
});

const deleteFileSchema = z.object({
  path: z.string().describe('The path of the file to delete.'),
});

const shellCommandSchema = z.object({
  command: z.string().describe('The shell command to execute.'),
});

export const listFilesTool = new DynamicStructuredTool({
  name: 'list_files',
  description: 'Lists all files and directories in a given path.',
  schema: listFilesSchema,
  func: async ({ path }: z.infer<typeof listFilesSchema>) => {
    try {
      const files = await fs.readdir(path, { withFileTypes: true });
      return files.map(file => `${file.name}${file.isDirectory() ? '/' : ''}`).join('\n');
    } catch (e: any) {
      return `Error listing files: ${e.message}`;
    }
  },
});

export const readFileTool = new DynamicStructuredTool({
  name: 'read_file',
  description: 'Reads the content of a file at a given path.',
  schema: readFileSchema,
  func: async ({ path }: z.infer<typeof readFileSchema>) => {
    try {
      return await fs.readFile(path, 'utf-8');
    } catch (e: any) {
      return `Error reading file: ${e.message}`;
    }
  },
});

export const writeFileTool = new DynamicStructuredTool({
  name: 'write_file',
  description: 'Writes content to a file at a given path. Creates the file if it does not exist.',
  schema: writeFileSchema,
  func: async ({ path, content }: z.infer<typeof writeFileSchema>) => {
    try {
      const CONTEXT_LINES = 2;
      let originalContent = '';
      try {
        originalContent = await fs.readFile(path, 'utf-8');
      } catch (e) {
        // File doesn't exist, which is fine for a write operation.
      }

      if (originalContent === content) {
        return JSON.stringify({ summary: `No changes made to ${path}.`, diff: '' });
      }

      await fs.writeFile(path, content, 'utf-8');

      const originalLines = originalContent.split('\n');
      const newLines = content.split('\n');
      let additions = 0;
      let removals = 0;
      const newLinesSet = new Set(newLines);
      const originalLinesSet = new Set(originalLines);

      for (const line of newLines) {
        if (!originalLinesSet.has(line)) additions++;
      }
      for (const line of originalLines) {
        if (!newLinesSet.has(line)) removals++;
      }

      let commonPrefix = 0;
      while (commonPrefix < originalLines.length && commonPrefix < newLines.length && originalLines[commonPrefix] === newLines[commonPrefix]) {
        commonPrefix++;
      }

      let commonSuffix = 0;
      while (commonSuffix < originalLines.length - commonPrefix && commonSuffix < newLines.length - commonPrefix && originalLines[originalLines.length - 1 - commonSuffix] === newLines[newLines.length - 1 - commonSuffix]) {
        commonSuffix++;
      }

      const diffSnippet: string[] = [];
      const prefixStartIndex = Math.max(0, commonPrefix - CONTEXT_LINES);
      for (let i = prefixStartIndex; i < commonPrefix; i++) {
        diffSnippet.push(`  ${originalLines[i]}`);
      }

      for (let i = commonPrefix; i < originalLines.length - commonSuffix; i++) {
        diffSnippet.push(`- ${originalLines[i]}`);
      }
      for (let i = commonPrefix; i < newLines.length - commonSuffix; i++) {
        diffSnippet.push(`+ ${newLines[i]}`);
      }

      const suffixStartIndex = newLines.length - commonSuffix;
      const suffixEndIndex = Math.min(newLines.length, suffixStartIndex + CONTEXT_LINES);
      for (let i = suffixStartIndex; i < suffixEndIndex; i++) {
        diffSnippet.push(`  ${newLines[i]}`);
      }

      const summary = `Updated ${path} with ${additions} addition(s) and ${removals} removal(s).`;
      return JSON.stringify({ summary, diff: diffSnippet.join('\n') });
    } catch (e: any) {
      return `Error writing to file: ${e.message}`;
    }
  },
});

export const deleteFileTool = new DynamicStructuredTool({
  name: 'delete_file',
  description: 'Deletes a file at a given path.',
  schema: deleteFileSchema,
  func: async ({ path }: z.infer<typeof deleteFileSchema>) => {
    try {
      await fs.unlink(path);
      return `Successfully deleted ${path}`;
    } catch (e: any) {
      return `Error deleting file: ${e.message}`;
    }
  },
});

export const shellCommandTool = new DynamicStructuredTool({
  name: 'execute_shell_command',
  description: 'Executes a shell command. Use this for tasks like installing dependencies, running tests, or managing git.',
  schema: shellCommandSchema,
  func: async ({ command }: z.infer<typeof shellCommandSchema>) => {
    try {
      const { stdout, stderr } = await execPromise(command);
      let result = '';
      if (stdout) result += `STDOUT:\n${stdout}\n`;
      if (stderr) result += `STDERR:\n${stderr}\n`;
      return result || 'Command executed successfully.';
    } catch (e: any) {
      return `Error executing command: ${e.message}\nSTDOUT:\n${e.stdout}\nSTDERR:\n${e.stderr}`;
    }
  },
});

export const tools = [
  listFilesTool,
  readFileTool,
  writeFileTool,
  deleteFileTool,
  shellCommandTool,
];