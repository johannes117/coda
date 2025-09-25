import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const shellCommandSchema = z.object({
  command: z.string().describe('The shell command to execute.'),
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

