import { describe, expect, it } from "@jest/globals";

import { applyConsoleFormat } from "./apply-console-format";

describe("applyConsoleFormat()", () => {
  it("should style text", () => {
    expect(applyConsoleFormat("fgMagenta", "test")).toBe("\u001b[35mtest\u001b[39m");
    expect(applyConsoleFormat(["fgYellow", "bgBrBlack", "blinking", [1, 0]], "test")).toBe("\u001b[33;100;5;1mtest\u001b[0;25;49;39m");
  });
});
