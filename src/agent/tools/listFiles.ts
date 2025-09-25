import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

const listFilesSchema = z.object({
  path: z.string().describe('The path of the directory to list.'),
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

