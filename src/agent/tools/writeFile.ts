import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { buildDiffLines } from '@lib/diff';

const writeFileSchema = z.object({
  path: z.string().describe('The path of the file to write to.'),
  content: z.string().describe('The content to write to the file.'),
});

export const writeFileTool = new DynamicStructuredTool({
  name: 'write_file',
  description: 'Writes content to a file at a given path. Creates the file if it does not exist.',
  schema: writeFileSchema,
  func: async ({ path, content }: z.infer<typeof writeFileSchema>) => {
    try {
      let originalContent = '';
      try {
        originalContent = await fs.readFile(path, 'utf-8');
      } catch (e) {
        // File doesn't exist, which is fine for a write operation.
      }

      if (originalContent === content) {
        return JSON.stringify({ summary: `No changes made to ${path}.`, diffLines: [] });
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

      const diffLines = buildDiffLines(originalLines, newLines);
      const summary = `Updated ${path} with ${additions} addition(s) and ${removals} removal(s).`;
      return JSON.stringify({ summary, diffLines });
    } catch (e: any) {
      return `Error executing command: ${e.message}\nSTDOUT:\n${e.stdout}\nSTDERR:\n${e.stderr}`;
    }
  },
});

