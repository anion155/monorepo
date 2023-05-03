import { createRequire } from "node:module";
import { resolve } from "node:path";

function ensureArray(items) {
  if (Array.isArray(items)) {
    return items.filter(Boolean);
  }
  if (items) {
    return [items];
  }
  return [];
}

/** @typedef {(source: string, importer: string | undefined, isResolved: boolean) => boolean | null | undefined | void} ExternalMatcher */
/**
 * @typedef {(
 *  | undefined
 *  | boolean
 *  | string
 *  | RegExp
 *  | Array<string | RegExp>
 *  | ExternalMatcher
 * )} ExternalOption
 */

/**
 * Creates id matcher based on external option of rollup config. Original code licensed under MIT and created by Rollup team
 * {@link https://github.com/rollup/rollup/blob/703e88fddb489793ce7828094d4ea3a322e76df9/src/utils/options/normalizeInputOptions.ts#L125}
 * @param {ExternalOption} option
 * @returns {ExternalMatcher}
 */
function getIdMatcher(option) {
  if (option === true) {
    return () => true;
  }
  if (typeof option === "function") {
    return (id, ...parameters) =>
      (!id.startsWith("\0") && option(id, ...parameters)) || false;
  }
  if (option) {
    const ids = new Set();
    const matchers = [];
    for (const value of ensureArray(option)) {
      if (value instanceof RegExp) {
        matchers.push(value);
      } else {
        ids.add(value);
      }
    }
    return (id) => ids.has(id) || matchers.some((matcher) => matcher.test(id));
  }
  return () => false;
}

/**
 * @param {{
 *  packageJsonFile?: string;
 *  bundled?: ExternalOption
 * }} [config]
 * @returns {import("rollup").Plugin}
 */
export default function externalDependenciesPlugin(config = {}) {
  const require = createRequire(process.cwd());
  const { packageJsonFile = resolve(process.cwd(), "./package.json") } = config;
  // const data = require("./data.json");

  return {
    name: "external-dependencies",

    options: async (options) => {
      const origMatcher = getIdMatcher(options.external);

      // eslint-disable-next-line import/no-dynamic-require -- intentional
      const pkg = require(packageJsonFile);
      const depsSet = new Set();
      if (pkg.dependencies) {
        for (const dep of Object.keys(pkg.dependencies)) {
          depsSet.add(dep);
        }
      }
      if (pkg.peerDependencies) {
        for (const dep of Object.keys(pkg.peerDependencies)) {
          depsSet.add(dep);
        }
      }
      const matchers = Array.from(depsSet).map(
        (dep) => new RegExp(`^${dep}(\\/.+)*$`)
      );
      const depsMatcher = (source) => {
        return matchers.some((matcher) => matcher.test(source));
      };

      const bundledMatcher = getIdMatcher(config.bundled);

      /** @type {ExternalMatcher} */
      const externalMatcher = function externalMatcher(
        source,
        importer,
        isResolved
      ) {
        const matchesExternal =
          origMatcher(source, importer, isResolved) || depsMatcher(source);
        return matchesExternal && !bundledMatcher(source, importer, isResolved);
      };

      return { ...options, external: externalMatcher };
    },
  };
}
