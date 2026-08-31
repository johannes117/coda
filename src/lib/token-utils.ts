/**
 * Token estimation and usage tracking utilities.
 *
 * Provides lightweight heuristics for estimating token counts without
 * pulling in a full tokenizer dependency. These estimates are used only
 * for UI display purposes (e.g. showing approximate usage in the status
 * line). For billing-accurate counts, rely on the API response usage
 * fields.
 */

import type { TokenUsage } from '@types';

// ─── Estimation constants ────────────────────────────────────────────────────

/**
 * Rough character-to-token ratio. The widely cited heuristic is ~4 chars
 * per token for English text, but code tends to have more tokens due to
 * punctuation and shorter identifiers. We use 3.5 as a middle ground.
 */
const CHARS_PER_TOKEN = 3.5;

/**
 * Words-to-token ratio. English averages ~0.75 tokens per word; code is
 * higher. We use 1.3 as a conservative estimate for mixed content.
 */
const WORDS_PER_TOKEN = 1.3;

/**
 * Estimated overhead per message for chat-formatting tokens (role tags,
 * separator tokens, etc.).
 */
const MESSAGE_OVERHEAD_TOKENS = 4;

// ─── Types ───────────────────────────────────────────────────────────────────

export type TokenEstimate = {
  /** Estimated token count for the text. */
  tokens: number;
  /** Character count of the input. */
  chars: number;
  /** Word count of the input. */
  words: number;
  /** Method used for estimation. */
  method: 'char' | 'word' | 'hybrid';
};

export type UsageBreakdown = {
  input: number;
  output: number;
  total: number;
  /** Estimated cost in USD, or null if pricing is unavailable. */
  estimatedCost: number | null;
};

// ─── Pricing table (per 1M tokens, in USD) ───────────────────────────────────

const PRICING_PER_MILLION: Record<string, { input: number; output: number }> = {
  'claude-opus-4-7': { input: 15.0, output: 75.0 },
  'gpt-5.5': { input: 10.0, output: 40.0 },
  'gemini-3-pro-preview': { input: 7.0, output: 21.0 },
  'gemini-3-flash-preview': { input: 0.15, output: 0.6 },
};

const DEFAULT_PRICING = { input: 5.0, output: 15.0 };

// ─── Core estimation functions ───────────────────────────────────────────────

/**
 * Estimate token count from character count.
 */
export function estimateFromChars(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate token count from word count.
 */
export function estimateFromWords(text: string): number {
  if (text.length === 0) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * WORDS_PER_TOKEN);
}

/**
 * Hybrid estimation that averages char-based and word-based estimates.
 * Tends to be more accurate for mixed prose/code content.
 */
export function estimateTokens(text: string): TokenEstimate {
  if (text.length === 0) {
    return { tokens: 0, chars: 0, words: 0, method: 'hybrid' };
  }

  const chars = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const charEstimate = Math.ceil(chars / CHARS_PER_TOKEN);
  const wordEstimate = Math.ceil(words * WORDS_PER_TOKEN);
  const tokens = Math.round((charEstimate + wordEstimate) / 2);

  return { tokens, chars, words, method: 'hybrid' };
}

/**
 * Estimate tokens for a full message (including formatting overhead).
 */
export function estimateMessageTokens(
  role: string,
  content: string,
): TokenEstimate {
  const base = estimateTokens(content);
  const roleTokens = estimateTokens(role).tokens;
  return {
    ...base,
    tokens: base.tokens + roleTokens + MESSAGE_OVERHEAD_TOKENS,
  };
}

/**
 * Estimate total tokens across a conversation history.
 */
export function estimateConversationTokens(
  messages: Array<{ role: string; content: string }>,
): TokenEstimate {
  let totalTokens = 0;
  let totalChars = 0;
  let totalWords = 0;

  for (const msg of messages) {
    const est = estimateMessageTokens(msg.role, msg.content);
    totalTokens += est.tokens;
    totalChars += est.chars;
    totalWords += est.words;
  }

  return {
    tokens: totalTokens,
    chars: totalChars,
    words: totalWords,
    method: 'hybrid',
  };
}

// ─── Cost estimation ─────────────────────────────────────────────────────────

/**
 * Get pricing for a model. Falls back to a default if the model is unknown.
 */
export function getModelPricing(modelName: string): { input: number; output: number } {
  return PRICING_PER_MILLION[modelName] ?? DEFAULT_PRICING;
}

/**
 * Estimate the cost in USD for a given token usage and model.
 */
export function estimateCost(
  usage: TokenUsage,
  modelName: string,
): number {
  const pricing = getModelPricing(modelName);
  const inputCost = (usage.input / 1_000_000) * pricing.input;
  const outputCost = (usage.output / 1_000_000) * pricing.output;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

/**
 * Build a full usage breakdown with cost estimation.
 */
export function buildUsageBreakdown(
  usage: TokenUsage,
  modelName: string,
): UsageBreakdown {
  return {
    input: usage.input,
    output: usage.output,
    total: usage.total,
    estimatedCost: estimateCost(usage, modelName),
  };
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

/**
 * Format a token count for display (e.g. 1234 → "1.2k", 1500000 → "1.5M").
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return String(tokens);
  if (tokens < 1_000_000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return `${(tokens / 1_000_000).toFixed(1)}M`;
}

/**
 * Format a cost in USD for display (e.g. 0.001234 → "$0.0012").
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1.0) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Format a usage breakdown as a human-readable string.
 */
export function formatUsageBreakdown(breakdown: UsageBreakdown): string {
  const input = formatTokenCount(breakdown.input);
  const output = formatTokenCount(breakdown.output);
  const total = formatTokenCount(breakdown.total);
  const cost = breakdown.estimatedCost !== null
    ? formatCost(breakdown.estimatedCost)
    : 'N/A';
  return `in:${input} out:${output} total:${total} (~${cost})`;
}

// ─── Context window helpers ──────────────────────────────────────────────────

/**
 * Calculate what fraction of the context window is consumed.
 * Returns a percentage (0-100).
 */
export function getContextWindowUsage(
  usedTokens: number,
  contextWindow: number,
): number {
  if (contextWindow <= 0) return 0;
  return Math.min(100, (usedTokens / contextWindow) * 100);
}

/**
 * Categorize context window usage into severity levels for UI coloring.
 */
export type UsageLevel = 'low' | 'medium' | 'high' | 'critical';

export function getUsageLevel(percentage: number): UsageLevel {
  if (percentage < 50) return 'low';
  if (percentage < 75) return 'medium';
  if (percentage < 90) return 'high';
  return 'critical';
}

/**
 * Determine if the conversation is approaching the context limit and
 * should be summarized or trimmed.
 */
export function shouldTrimContext(
  usedTokens: number,
  contextWindow: number,
  threshold = 0.85,
): boolean {
  if (contextWindow <= 0) return false;
  return usedTokens / contextWindow >= threshold;
}

/**
 * Calculate how many tokens of context headroom remain.
 */
export function getContextHeadroom(
  usedTokens: number,
  contextWindow: number,
): number {
  return Math.max(0, contextWindow - usedTokens);
}
