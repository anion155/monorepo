import { describe, expect, it } from "@jest/globals";

import { styleConsoleText } from "./style-console-text";

describe("styleConsoleText()", () => {
  it("should style text", () => {
    expect(styleConsoleText("magenta", "test")).toBe("\u001b[35mtest\u001b[39m");
    expect(styleConsoleText(["yellow", "bgGray", "blink"], "test")).toBe("\u001b[33m\u001b[100m\u001b[5mtest\u001b[25m\u001b[49m\u001b[39m");
  });
});
