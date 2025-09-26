import { evaluate } from "langsmith/evaluation";
import { createLLMAsJudge, CORRECTNESS_PROMPT } from "openevals";
import { createAgent } from "@agent/graph";
import { z } from "zod";
import type { ModelConfig } from "@types";
import { HumanMessage } from "@langchain/core/messages";

const evalDatasetSchema = z.object({
  input: z.string().describe("User query"),
  expectedOutput: z.string().describe("Expected agent response summary"),
});

export type EvalDataset = z.infer<typeof evalDatasetSchema>[];

export const DATASET_NAME = "coda-agent-evaluations";

export const DEFAULT_EVAL_DATASET: EvalDataset = [
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


export function createTargetFunction(apiKey: string, modelConfig: ModelConfig) {
  const agent = createAgent(apiKey, modelConfig);

  return async function target(inputs: { question: string }): Promise<{ answer: string }> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Agent timeout after 30 seconds')), 30000)
      );

      const agentPromise = agent.invoke({
        messages: [new HumanMessage(inputs.question)]
      });

      const result = await Promise.race([agentPromise, timeoutPromise]);
      const finalMessage = result.messages[result.messages.length - 1];

      const answer = typeof finalMessage.content === 'string' ? finalMessage.content :
                    Array.isArray(finalMessage.content) ? finalMessage.content.map((c: any) =>
                      typeof c === 'string' ? c : JSON.stringify(c)
                    ).join(' ') : "No response";

      return { answer };
    } catch (error) {
      return {
        answer: `Error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
}

export function createSuccessEvaluator() {
  return async function successEvaluator(params: {
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    referenceOutputs?: Record<string, unknown>;
  }) {
    const output = (params.outputs as { answer?: string })?.answer || "";
    const outputLower = output.toLowerCase();

    const hasError = outputLower.includes("error:") ||
                    outputLower.includes("failed") ||
                    outputLower.includes("timeout");

    const hasSuccess = outputLower.includes("success") ||
                      outputLower.includes("completed") ||
                      outputLower.includes("done") ||
                      outputLower.includes("created") ||
                      outputLower.includes("listed") ||
                      outputLower.includes("executed") ||
                      outputLower.includes("deleted");

    let score = 0.5; // neutral
    let reasoning = "Neutral response";

    if (hasError) {
      score = 0;
      reasoning = "Response contains error indicators";
    } else if (hasSuccess) {
      score = 1;
      reasoning = "Response indicates successful completion";
    }

    return {
      key: "success",
      score,
      comment: reasoning,
    };
  };
}

export function createCorrectnessEvaluator() {
  return async function correctnessEvaluator(params: {
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    referenceOutputs?: Record<string, unknown>;
  }) {
    const evaluator = createLLMAsJudge({
      prompt: CORRECTNESS_PROMPT,
      model: "openai:gpt-5-mini-2025-08-07",
      feedbackKey: "correctness",
    });

    return await evaluator(params);
  };
}

export async function runAgentEvals(
  apiKey: string,
  modelConfig: ModelConfig,
  datasetName: string = DATASET_NAME,
  experimentPrefix: string = "coda-agent-eval"
) {
  if (!process.env.LANGSMITH_API_KEY) {
    throw new Error('LANGSMITH_API_KEY environment variable is required');
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required for evaluations');
  }

  const target = createTargetFunction(apiKey, modelConfig);
  const successEvaluator = createSuccessEvaluator();
  const correctnessEvaluator = createCorrectnessEvaluator();

  const results = await evaluate(target, {
    data: datasetName,
    evaluators: [
      successEvaluator,
      correctnessEvaluator,
    ],
    experimentPrefix,
    maxConcurrency: 1, // Run sequentially to avoid overwhelming the agent
    metadata: {
      model: modelConfig.name,
      effort: modelConfig.effort,
      timestamp: new Date().toISOString(),
    },
  });

  return results;
}
