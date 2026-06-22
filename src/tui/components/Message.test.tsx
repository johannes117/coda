import { renderToString } from "@tui/test-utils/render.js";
import { Message } from "./Message.js";
import type { Message as MessageType } from "@types";

describe("Message", () => {
  it("renders a user prompt without a leading bullet", async () => {
    const message: MessageType = {
      id: "1",
      author: "user",
      chunks: [{ kind: "text", text: "How do I install bun?" }],
    };

    const frame = await renderToString(<Message message={message} />);

    expect(frame).toContain("How do I install bun?");
    expect(frame).toContain("> ");
    expect(frame).not.toMatch(/^[●⏺]/m);
  });

  it("shows the leading dot only on the first assistant text chunk", async () => {
    const message: MessageType = {
      id: "1",
      author: "agent",
      chunks: [
        { kind: "text", text: "First paragraph." },
        { kind: "text", text: "Second paragraph." },
      ],
    };

    const frame = await renderToString(<Message message={message} />);

    const dotMatches = frame.match(/[●⏺]/g) ?? [];
    expect(dotMatches.length).toBe(1);
    expect(frame).toContain("First paragraph.");
    expect(frame).toContain("Second paragraph.");
  });

  it("renders a tool execution under a separate AssistantToolUseMessage", async () => {
    const message: MessageType = {
      id: "1",
      author: "system",
      chunks: [
        {
          kind: "tool-execution",
          toolCallId: "t1",
          toolName: "execute",
          toolArgs: { command: "ls" },
          status: "success",
          output: "src\nREADME.md",
        },
      ],
    };

    const frame = await renderToString(<Message message={message} />);

    expect(frame).toContain("Bash(");
    expect(frame).toContain("ls");
    expect(frame).toContain("⎿");
    expect(frame).toContain("src");
    expect(frame).toContain("README.md");
  });

  it("uses the structured Read summary even when no diff is parseable", async () => {
    const message: MessageType = {
      id: "1",
      author: "system",
      chunks: [
        {
          kind: "tool-execution",
          toolCallId: "t1",
          toolName: "read_file",
          toolArgs: { file_path: "/tmp/sample.txt" },
          status: "success",
          output: "alpha\nbeta\ngamma\ndelta",
        },
      ],
    };

    const frame = await renderToString(<Message message={message} />);

    expect(frame).toContain("Read(");
    expect(frame).toContain("Read 4 lines");
  });
});
