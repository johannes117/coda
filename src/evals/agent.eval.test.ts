import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { runAgentEvals } from './agent.eval.js';
import type { ModelConfig } from '@types';
import { config } from 'dotenv';
import { promises as fs } from 'fs';
import { existsSync } from 'fs';

describe('Agent Evaluations', () => {
  let apiKey: string;
  let modelConfig: ModelConfig;

  beforeAll(() => {
    config();

    apiKey = process.env.OPENROUTER_API_KEY || '';

    if (!apiKey) {
      console.warn('No API key found. Set OPENROUTER_API_KEY in .env file to run agent evals.');
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

  it('should run basic agent evaluations', async () => {
    if (!apiKey) {
      console.log('Skipping agent eval test - no API key provided');
      return;
    }

    const results = await runAgentEvals(apiKey, modelConfig);

    expect(results).toBeDefined();
    expect(results.summary).toBeDefined();
    expect(results.results).toBeInstanceOf(Array);
    expect(results.summary.totalTests).toBeGreaterThan(0);
    expect(results.summary.avgScore).toBeGreaterThanOrEqual(0);
    expect(results.summary.avgScore).toBeLessThanOrEqual(1);
    expect(results.summary.successRate).toBeGreaterThanOrEqual(0);
    expect(results.summary.successRate).toBeLessThanOrEqual(1);

    console.log('Agent Eval Results:', {
      totalTests: results.summary.totalTests,
      avgScore: results.summary.avgScore.toFixed(2),
      successRate: `${(results.summary.successRate * 100).toFixed(1)}%`,
      avgDuration: `${results.summary.avgDuration.toFixed(0)}ms`
    });
  }, 60000); // 60 second timeout for all test cases (5 cases x 10s + buffer)

  it('should handle evaluation errors gracefully', async () => {
    // Test with invalid API key to ensure error handling
    const results = await runAgentEvals('invalid-key', modelConfig);

    expect(results).toBeDefined();
    expect(results.results).toBeInstanceOf(Array);
    expect(results.results.length).toBeGreaterThan(0);

    // All results should have score of 0 due to errors
    results.results.forEach((result: any) => {
      expect(result.score).toBe(0);
      expect(result.success).toBe(false);
      expect(result.actualOutput).toContain('Error:');
    });
  });

  it('should process custom evaluation datasets', async () => {
    if (!apiKey) {
      console.log('Skipping custom dataset test - no API key provided');
      return;
    }

    const customDataset = [
      {
        input: "Say hello",
        expectedOutput: "Should respond with greeting"
      }
    ];

    const results = await runAgentEvals(apiKey, modelConfig, customDataset);

    expect(results.summary.totalTests).toBe(1);
    expect(results.results[0].input).toBe("Say hello");
  }, 15000);
});