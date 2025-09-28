import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createSuccessResult, createErrorResult } from '@lib/tool-result';

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
      let output = '';
      if (stdout) output += `STDOUT:\n${stdout}\n`;
      if (stderr) output += `STDERR:\n${stderr}\n`;
      return createSuccessResult({
        message: output || 'Command executed successfully.',
        stdout,
        stderr
      });
    } catch (e: any) {
      return createErrorResult(`Error executing command: ${e.message}\nSTDOUT:\n${e.stdout || ''}\nSTDERR:\n${e.stderr || ''}`);
    }
  },
});

