import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { createSuccessResult, createErrorResult } from '@lib/tool-result';

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
      const fileList = files.map(file => `${file.name}${file.isDirectory() ? '/' : ''}`);
      return createSuccessResult({ files: fileList, listing: fileList.join('\n') });
    } catch (e: any) {
      return createErrorResult(`Error listing files: ${e.message}`);
    }
  },
});

