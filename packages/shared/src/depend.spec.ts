import "./disposable";

import { describe, expect, it } from "@jest/globals";

import type { Dependency, DependentDependency } from "./depend";
import { CircularDependencyError, createDependTools } from "./depend";

describe("depend tools", () => {
  const depend = createDependTools();

  interface Module extends DependentDependency {}
  class Module {
    #stack: DisposableStack;

    constructor(
      public readonly name: string,
      dependencies: Module[],
    ) {
      depend.dependents.stamp(this);
      depend.dependencies.stamp(this);
      const stack = new DisposableStack();
      dependencies.forEach((dependency) => stack.append(depend.bind(this, dependency)));
      this.#stack = stack.move();
    }

    [Symbol.dispose]() {
      this.#stack.dispose();
    }
  }
  interface LeafModule extends Dependency {}
  class LeafModule {
    constructor(public readonly name: string) {
      depend.dependents.stamp(this);
    }
  }

  it("should bind dependencies", () => {
    const moduleA = new Module("a", []);
    const moduleB = new Module("b", [moduleA]);
    const moduleC = new Module("c", []);
    const moduleD = new Module("d", [moduleA, moduleB, moduleC]);

    expect(depend.dependencies.get(moduleD)).toStrictEqual(new Set([moduleA, moduleB, moduleC]));
    expect(depend.dependents.get(moduleD)).toStrictEqual(new Set([]));

    expect(depend.dependencies.get(moduleC)).toStrictEqual(new Set([]));
    expect(depend.dependents.get(moduleC)).toStrictEqual(new Set([moduleD]));

    expect(depend.dependencies.get(moduleB)).toStrictEqual(new Set([moduleA]));
    expect(depend.dependents.get(moduleB)).toStrictEqual(new Set([moduleD]));

    expect(depend.dependencies.get(moduleA)).toStrictEqual(new Set([]));
    expect(depend.dependents.get(moduleA)).toStrictEqual(new Set([moduleB, moduleD]));

    depend.unbind(moduleB, moduleA);
    expect(depend.dependencies.get(moduleB)).toStrictEqual(new Set([]));
    expect(depend.dependents.get(moduleA)).toStrictEqual(new Set([moduleD]));

    moduleD[Symbol.dispose]();
    expect(depend.dependencies.get(moduleD)).toStrictEqual(new Set([]));
    expect(depend.dependents.get(moduleC)).toStrictEqual(new Set([]));
    expect(depend.dependents.get(moduleB)).toStrictEqual(new Set([]));
    expect(depend.dependents.get(moduleA)).toStrictEqual(new Set([]));
  });

  it("should throw error on circular dependency creation", () => {
    const moduleA = new Module("a", []);
    const moduleB = new Module("b", [moduleA]);
    const moduleC = new Module("c", [moduleB]);
    expect(() => depend.bind(moduleA, moduleC)).toThrow(new CircularDependencyError());
  });

  it("should return rank of dependencies", () => {
    const moduleA = new Module("a", []);
    const moduleB = new Module("b", [moduleA]);
    const moduleC = new Module("c", []);
    const moduleL = new LeafModule("l");

    expect(depend.rank(moduleA, moduleC)).toBe(-1);
    expect(depend.rank(moduleC, moduleA)).toBe(-1);

    expect(depend.rank(moduleA, moduleA)).toBe(0);

    expect(depend.rank(moduleB, moduleA)).toBe(1);
    expect(depend.rank(moduleA, moduleB)).toBe(-1);

    depend.bind(moduleC, moduleB);
    expect(depend.rank(moduleC, moduleA)).toBe(2);
    expect(depend.rank(moduleA, moduleC)).toBe(-1);

    depend.bind(moduleC, moduleA);
    expect(depend.rank(moduleC, moduleA)).toBe(1);
    depend.unbind(moduleC, moduleA);

    expect(depend.rank(moduleC, moduleL)).toBe(-1);
    depend.bind(moduleC, moduleL);
    expect(depend.rank(moduleC, moduleL)).toBe(1);
    expect(depend.rank(moduleC, moduleA)).toBe(2);
  });

  it("should unbind all dependencies", () => {
    const moduleA = new Module("a", []);
    const moduleB = new Module("b", [moduleA]);
    const moduleC = new Module("c", [moduleB, moduleA]);

    depend.clearDependecies(moduleC);
    expect(depend.rank(moduleC, moduleA)).toBe(-1);
    expect(depend.rank(moduleC, moduleB)).toBe(-1);
    expect(depend.rank(moduleB, moduleA)).toBe(1);
  });
});
