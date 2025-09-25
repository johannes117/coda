import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

const deleteFileSchema = z.object({
  path: z.string().describe('The path of the file to delete.'),
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

