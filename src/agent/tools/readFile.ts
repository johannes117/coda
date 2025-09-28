import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { createSuccessResult, createErrorResult } from '@lib/tool-result';

const readFileSchema = z.object({
  path: z.string().describe('The path of the file to read.'),
});

export const readFileTool = new DynamicStructuredTool({
  name: 'read_file',
  description: 'Reads the content of a file at a given path.',
  schema: readFileSchema,
  func: async ({ path }: z.infer<typeof readFileSchema>) => {
    try {
      const content = await fs.readFile(path, 'utf-8'); // Might ruin context window if file is massive.
      return createSuccessResult({ content });
    } catch (e: any) {
      return createErrorResult(`Error reading file: ${e.message}`);
    }
  },
});

