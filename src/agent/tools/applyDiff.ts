import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { applyPatch, buildDiffLines } from '@lib/diff';

const applyDiffSchema = z.object({
  path: z.string().describe('The path of the file to apply the diff to.'),
  diff: z.string().describe('The diff to apply to the file in unified diff format.'),
});

export const applyDiffTool = new DynamicStructuredTool({
  name: 'apply_diff',
  description: 'Applies a diff patch to a file to modify it. Use this for making changes to existing files. For creating a new file, use write_file.',
  schema: applyDiffSchema,
  func: async ({ path, diff }: z.infer<typeof applyDiffSchema>) => {
    try {
      let originalContent = '';
      try {
        originalContent = await fs.readFile(path, 'utf-8');
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          // File doesn't exist. If diff creates a new file (--- /dev/null), it's ok.
          if (!diff.includes('--- /dev/null')) {
              return `Error: File ${path} does not exist. Use write_file to create a new file.`;
          }
        } else {
            return `Error reading original file: ${e.message}`;
        }
      }

      const { newContent } = applyPatch(originalContent, diff);

      if (originalContent === newContent) {
        return JSON.stringify({ summary: `No changes made to ${path}.`, diffLines: [] });
      }

      await fs.writeFile(path, newContent, 'utf-8');

      const originalLines = originalContent.split('\n');
      const newLines = newContent.split('\n');
      const diffLines = buildDiffLines(originalLines, newLines);
      let additions = 0;
      let removals = 0;

      diffLines.forEach(line => {
        if (line.type === 'add') additions++;
        if (line.type === 'remove') removals++;
      });

      const summary = `Updated ${path} with ${additions} addition(s) and ${removals} removal(s).`;

      return JSON.stringify({ summary, diffLines });
    } catch (e: any) {
      return `Error applying diff: ${e.message}`;
    }
  },
});