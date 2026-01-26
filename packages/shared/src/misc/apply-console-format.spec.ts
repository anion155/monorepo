import { describe, expect, it } from "@jest/globals";

import { applyConsoleFormat } from "./apply-console-format";

describe("applyConsoleFormat()", () => {
  it("should style text", () => {
    process.stdout.isTTY = true;
    expect(applyConsoleFormat("fgMagenta", "test").replaceAll("\u001b", "ESC")).toBe("ESC[35mtestESC[39m");
    expect(applyConsoleFormat(["fgYellow", "bgBrBlack", "blinking", [1, 0]], "test").replaceAll("\u001b", "ESC")).toBe(
      "ESC[33;100;5;1mtestESC[0;25;49;39m",
    );
    expect(applyConsoleFormat(["fgYellow", "bgBrBlack", ["gg", "hh"], ["oo", "pp"], "blinking"], "test").replaceAll("\u001b", "ESC")).toBe(
      "ESC[33;100mggooESC[5mtestESC[25mpphhESC[49;39m",
    );
    expect(
      applyConsoleFormat([["SETA", "RES"]], `bold ${applyConsoleFormat([["SETB", "RES"]], "dim and bold")} bold`).replaceAll("\u001b", "ESC"),
    ).toBe("SETAbold SETBdim and boldRESSETA boldRES");
    expect(applyConsoleFormat(["bold"], `bold \u001b[2mdim and bold\u001b[22m bold`).replaceAll("\u001b", "ESC")).toBe(
      "ESC[1mbold ESC[2mdim and boldESC[22;1m boldESC[22m",
    );
  });
});
