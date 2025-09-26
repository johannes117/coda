import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import {
  runAgentEvals,
  createTargetFunction,
  createSuccessEvaluator,
  DATASET_NAME,
} from './agent.eval.js';
import type { ModelConfig } from '@types';
import { config } from 'dotenv';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

describe('LangSmith Agent Evaluations', () => {
  let apiKey: string;
  let modelConfig: ModelConfig;

  beforeAll(() => {
    config();

    apiKey = process.env.OPENROUTER_API_KEY || '';

    if (!apiKey) {
      console.warn('No API key found. Set OPENROUTER_API_KEY in .env file to run agent evals.');
    }

    if (!process.env.LANGSMITH_API_KEY) {
      console.warn('No LangSmith API key found. Set LANGSMITH_API_KEY in .env file to run LangSmith evals.');
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('No OpenAI API key found. Set OPENAI_API_KEY in .env file for evaluators.');
    }

    modelConfig = {
      name: 'x-ai/grok-code-fast-1',
      effort: 'medium'
    };
  });

  beforeEach(async () => {
    // Ensure .tmp directory exists
    try {
      await fs.mkdir('.tmp', { recursive: true });
    } catch (e) {
      // Directory already exists
    }
  });

  afterEach(async () => {
    // Cleanup test files
    const testFiles = ['.tmp/eval-test.txt', 'example.txt'];
    for (const file of testFiles) {
      try {
        if (existsSync(file)) {
          await fs.unlink(file);
        }
      } catch (e) {
        // File might not exist, ignore
      }
    }
  });


  it('should create target function that invokes agent', async () => {
    if (!apiKey) {
      console.log('Skipping target function test - no API key provided');
      return;
    }

    const target = createTargetFunction(apiKey, modelConfig);
    const result = await target({ question: "Say hello" });

    expect(result).toBeDefined();
    expect(result.answer).toBeDefined();
    expect(typeof result.answer).toBe('string');
  }, 30000);

  it('should evaluate with success evaluator', async () => {
    const successEvaluator = createSuccessEvaluator();

    // Test successful case
    const successResult = await successEvaluator({
      inputs: { question: "Test query" },
      outputs: { answer: "Task completed successfully" },
      referenceOutputs: { expected: "Should complete task" }
    });

    expect(successResult.key).toBe('success');
    expect(successResult.score).toBe(1);
    expect(successResult.comment).toContain('successful');

    // Test error case
    const errorResult = await successEvaluator({
      inputs: { question: "Test query" },
      outputs: { answer: "Error: Something went wrong" },
      referenceOutputs: { expected: "Should complete task" }
    });

    expect(errorResult.score).toBe(0);
    expect(errorResult.comment).toContain('error');
  });

  it('should run full LangSmith evaluation', async () => {
    if (!apiKey || !process.env.LANGSMITH_API_KEY || !process.env.OPENAI_API_KEY) {
      console.log('Skipping full evaluation test - missing required API keys');
      return;
    }

    const experimentPrefix = `test-experiment-${Date.now()}`;
    const results = await runAgentEvals(
      apiKey,
      modelConfig,
      DATASET_NAME,
      experimentPrefix
    );

    expect(results).toBeDefined();
    expect(results.experimentName).toContain(experimentPrefix);
    expect(results.results).toBeDefined();

    console.log('LangSmith Evaluation Results:', {
      experimentName: results.experimentName,
      resultsCount: results.results?.length || 0
    });
  }, 120000); // 2 minute timeout for full evaluation

  it('should handle target function errors gracefully', async () => {
    const target = createTargetFunction('invalid-key', modelConfig);
    const result = await target({ question: "Test query" });

    expect(result).toBeDefined();
    expect(result.answer).toContain('Error:');
  }, 30000);
});