import { describe, it, expect } from "vitest";
import { validateApiKey } from "../api-key-format.js";

describe("validateApiKey", () => {
  it("rejects empty input", () => {
    expect(validateApiKey("openai", "")).toMatch(/empty/i);
  });

  it("flags a leftover bracketed-paste prefix", () => {
    const corrupted = "[200~sk-proj-" + "x".repeat(80);
    expect(validateApiKey("openai", corrupted)).toMatch(/bracketed-paste/i);
  });

  it("rejects whitespace and control chars", () => {
    expect(validateApiKey("openai", "sk-foo\nbar")).toMatch(/whitespace|control/i);
    expect(validateApiKey("openai", "sk-foo bar")).toMatch(/whitespace|control/i);
  });

  describe("openai", () => {
    it("accepts a plausible sk- key", () => {
      expect(validateApiKey("openai", "sk-" + "a".repeat(48))).toBeNull();
    });
    it("accepts a plausible sk-proj- key", () => {
      expect(validateApiKey("openai", "sk-proj-" + "a".repeat(150))).toBeNull();
    });
    it("rejects a key missing the sk- prefix (e.g., the o-IBqjsl... regression)", () => {
      const reason = validateApiKey(
        "openai",
        "o-IBqjsl7KFXrvkqHJT3BlbkFJZ2bXdVhSP0JGqjnWW4UKwI_RLRiEaNhCwCTlhGUXRt4V_jx7POpxHS1JmzSKkAoE_M2fNvf0IA",
      );
      expect(reason).toMatch(/sk-/);
    });
    it("rejects a sk- key that is suspiciously short", () => {
      expect(validateApiKey("openai", "sk-tooShort")).toMatch(/short|truncated/i);
    });
  });

  describe("anthropic", () => {
    it("accepts a plausible sk-ant- key", () => {
      expect(validateApiKey("anthropic", "sk-ant-" + "a".repeat(80))).toBeNull();
    });
    it("rejects a non-sk-ant- key", () => {
      expect(validateApiKey("anthropic", "sk-" + "a".repeat(80))).toMatch(/sk-ant-/);
    });
  });

  describe("fireworks", () => {
    it("accepts a plausible fw_ key", () => {
      expect(validateApiKey("fireworks", "fw_" + "a".repeat(40))).toBeNull();
    });
    it("rejects keys missing the fw_ prefix", () => {
      expect(validateApiKey("fireworks", "sk-" + "a".repeat(40))).toMatch(/fw_/);
    });
  });
});
