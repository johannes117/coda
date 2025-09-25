import { Client } from "langsmith";
import { createAgent } from "@agent/graph";
import { z } from "zod";
import type { ModelConfig } from "@types";
import { HumanMessage } from "@langchain/core/messages";

const evalDatasetSchema = z.object({
  input: z.string().describe("User query"),
  expectedOutput: z.string().describe("Expected agent response summary"),
});

const evalDataset = [
  {
    input: "List files in current directory",
    expectedOutput: "Returns file list without errors",
  },
  {
    input: "Write content 'test' to .tmp/eval-test.txt",
    expectedOutput: "Writes a file without errors",
  },
  {
    input: "Read .tmp/eval-test.txt",
    expectedOutput: "Reads a file without errors",
  },
  {
    input: "Execute shell command 'echo hello'",
    expectedOutput: "Executes a shell command without errors",
  },
  {
    input: "Delete .tmp/eval-test.txt",
    expectedOutput: "Deletes a file without errors",
  },
];

export async function runAgentEvals(
  apiKey: string,
  modelConfig: ModelConfig,
  dataset: z.infer<typeof evalDatasetSchema>[] = evalDataset
) {
  const agent = createAgent(apiKey, modelConfig);
  const results = [];

  for (const testCase of dataset) {
    try {
      const startTime = Date.now();

      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test case timeout after 10 seconds')), 10000)
      );

      const agentPromise = agent.invoke({
        messages: [new HumanMessage(testCase.input)]
      });

      const result = await Promise.race([agentPromise, timeoutPromise]) as any;

      const endTime = Date.now();
      const duration = endTime - startTime;

      const finalMessage = result.messages[result.messages.length - 1];
      const output = typeof finalMessage.content === 'string' ? finalMessage.content :
                    Array.isArray(finalMessage.content) ? finalMessage.content.map((c: any) =>
                      typeof c === 'string' ? c : JSON.stringify(c)
                    ).join(' ') : "";

      const outputLower = output.toLowerCase();
      const hasSuccess = outputLower.includes("success") ||
                        outputLower.includes("completed") ||
                        outputLower.includes("done");

      const score = hasSuccess ? 1 : 0.5;

      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: output,
        score,
        duration,
        success: hasSuccess,
      });

    } catch (error) {
      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: `Error: ${error instanceof Error ? error.message : String(error)}`,
        score: 0,
        duration: 0,
        success: false,
      });
    }
  }

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const avgScore = totalScore / results.length;
  const successRate = results.filter(r => r.success).length / results.length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  return {
    results,
    summary: {
      totalTests: results.length,
      avgScore,
      successRate,
      avgDuration,
    },
  };
}
