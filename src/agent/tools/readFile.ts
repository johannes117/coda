import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

const readFileSchema = z.object({
  path: z.string().describe('The path of the file to read.'),
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

