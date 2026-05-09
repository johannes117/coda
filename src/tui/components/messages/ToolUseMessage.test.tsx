import { render } from "ink-testing-library";
import { ToolUseMessage } from "./ToolUseMessage.js";
import type { Chunk } from "@types";

describe("ToolUseMessage", () => {
  it("renders edit_file calls as a diff instead of raw arguments", () => {
    const chunk: Chunk = {
      kind: "tool-execution",
      toolCallId: "tool-1",
      toolName: "edit_file",
      toolArgs: {
        file_path: "/tmp/example.ts",
        old_string: "const value = 1;",
        new_string: "const value = 2;",
      },
      status: "success",
      output: "Successfully replaced 1 occurrence(s) in '/tmp/example.ts'",
    };

    const { lastFrame } = render(<ToolUseMessage chunk={chunk} />);
    const frame = lastFrame() ?? "";

    expect(frame).toContain("Edit(");
    expect(frame).toContain("/tmp/example.ts");
    expect(frame).toContain("-const value = 1;");
    expect(frame).toContain("+const value = 2;");
    expect(frame).not.toContain("old_string=");
    expect(frame).not.toContain("new_string=");

    const lines = frame.split("\n").map((line) => line.trim());
    const headingIndex = lines.findIndex((line) => line.includes("Edit("));
    const summaryIndex = lines.findIndex((line) => line.includes("Added 1 line"));
    const firstDiffLineIndex = lines.findIndex((line) =>
      line.includes("-const value = 1;"),
    );

    expect(summaryIndex).toBe(headingIndex + 1);
    expect(lines.slice(summaryIndex + 1, firstDiffLineIndex)).not.toContain("");
  });
});
