import "./global/branding";

import { createErrorClass } from "./errors";
import { Stamper } from "./stamper";

/** Brand type to differentiate values that can depend on other values */
export type Dependent = Branded<unknown, "Dependent">;
/** Brand type to differentiate values that can be dependent on */
export type Dependency = Branded<unknown, "Dependency">;
/** Brand type to differentiate values that can be both depended on and be depended from */
export type DependentDependency = Dependent & Dependency;

/** Indicates circular error in dependencies */
export class CircularDependencyError extends createErrorClass("CircularDependencyError", "trying to create circular dependency") {}

/**
 * Utility to create your own depedability tools
 *
 * @example
 * const depend = createDependTools();
 *
 * interface Module extends DependentDependency {}
 * class Module {
 *   constructor(dependencies: Module[]) {
 *     depend.dependents.stamp(this);
 *     depend.dependencies.stamp(this);
 *     dependencies.forEach(dependency => depend.bind(this, dependency))
 *   }
 * }
 *
 * const moduleA = new Module([]);
 * const moduleB = new Module([moduleA]);
 * const moduleC = new Module([]);
 * const moduleD = new Module([moduleA, moduleB, moduleC]);
 * //         |-> moduleA
 * // moduleD |-> moduleB -> moduleA
 * //         |-> moduleC
 */
export function createDependTools<SDependent extends Dependent = Dependent, SDependency extends Dependency = Dependency>() {
  /** Dependencies {@link Stamper} instance, stores {@link Set} of Dependencies */
  const dependencies = new Stamper<SDependent, Set<SDependency>>(() => new Set());
  /** Dependents {@link Stamper} instance, stores {@link Set} of Dependents */
  const dependents = new Stamper<SDependency, Set<SDependent>>(() => new Set());

  /**
   * Counts dependency rank of {@link dependent} to {@link dependency}.
   * Returns -1 if {@link dependent} does not depend on {@link dependency}.
   * Returns 0 if {@link dependent} is same reference as {@link dependency}.
   * Returns 1 if {@link dependent} directly depends on {@link dependency}.
   * Otherwise return rank number of dependency.
   */
  function rank(dependent: SDependent, dependency: SDependency): number {
    const queue: [SDependent, number][] = [[dependent, 0]];
    while (queue.length) {
      const [current, rank] = queue.shift()!;
      // @ts-expect-error(2367)
      if (current === dependency) return rank;
      const deps = dependencies.get(current);
      if (deps.has(dependency)) return rank + 1;
      dependencies.get(current).forEach((dep) => {
        if (!dependencies.has(dep)) return;
        queue.push([dep, rank + 1]);
      });
    }
    return -1;
  }

  /**
   * Binds dependent to dependency. Returns function that would unbind them.
   * @throws {CircularDependencyError} if {@link dependency} already depends on {@link dependent}.
   */
  function bind(dependent: SDependent, dependency: SDependency) {
    if (dependencies.has(dependency) && dependents.has(dependent)) {
      if (rank(dependency, dependent) >= 0) throw new CircularDependencyError();
    }
    dependencies.get(dependent).add(dependency);
    dependents.get(dependency).add(dependent);
    return () => unbind(dependent, dependency);
  }

  /** Unbinds dependent from dependency */
  function unbind(dependent: SDependent, dependency: SDependency) {
    dependencies.get(dependent).delete(dependency);
    dependents.get(dependency).delete(dependent);
  }

  return { dependencies, dependents, bind, unbind, rank };
}
