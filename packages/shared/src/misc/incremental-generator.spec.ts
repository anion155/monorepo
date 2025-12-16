import { describe, expect, it } from "@jest/globals";

import { incrementGenerator } from "./incremental-generator";

describe("incrementalGenerator()", () => {
  it("should create iterator-like object with custom current property", () => {
    const generator = incrementGenerator();
    expect(generator.current).toBe(0);
    generator.next();
    expect(generator.current).toBe(1);
    generator.next();
    expect(generator.current).toBe(2);
    Object.assign(generator, { current: Number.MAX_SAFE_INTEGER });
    generator.next();
    expect(generator.current).toBe(0);
  });

  it("this.return() should stop iteration", () => {
    const generator = incrementGenerator();
    expect(generator.return()).toStrictEqual({ value: undefined, done: true });
    expect(generator.next()).toStrictEqual({ done: true });
  });
});
