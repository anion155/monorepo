import "../global";
import "../symbols";

import { describe, expect, it } from "@jest/globals";

describe("Explicit resource management proposal", () => {
  it("global polyfills", () => {
    expect(Symbol).toHaveProperty("dispose");
    expect(Symbol).toHaveProperty("asyncDispose");
    expect(globalThis).toHaveProperty("SuppressedError");
    expect(globalThis).toHaveProperty("DisposableStack");
    expect(globalThis).toHaveProperty("AsyncDisposableStack");
  });
});
