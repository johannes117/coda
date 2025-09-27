import { listFilesTool } from './listFiles.js';
import { readFileTool } from './readFile.js';
import { writeFileTool } from './writeFile.js';
import { deleteFileTool } from './deleteFile.js';
import { shellCommandTool } from './shell.js';
import { applyDiffTool } from './applyDiff.js';

export { listFilesTool, readFileTool, writeFileTool, deleteFileTool, shellCommandTool, applyDiffTool };

export const tools = [
  // Keep ordering explicit and readable
  // to ensure deterministic tool exposure
  // for the agent graph.
  // Note: tool names are referenced in UI.
  // Changing names is a breaking change.
  listFilesTool,
  readFileTool,
  writeFileTool,
  applyDiffTool,
  deleteFileTool,
  shellCommandTool,
];
