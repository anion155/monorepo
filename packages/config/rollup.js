const commonjs = require("@rollup/plugin-commonjs").default;
const nodeResolve = require("@rollup/plugin-node-resolve").default;
const replace = require("@rollup/plugin-replace").default;
const typescript = require("@rollup/plugin-typescript").default;
const external = require("rollup-plugin-peer-deps-external");

const fs = require("fs");
const path = require("path");

/**
 * @param {boolean} production
 * @returns {import("rollup").Plugin[]}
 */
function createPlugins(production) {
  return[
    external({ includeDependencies: true }),
    replace({
      preventAssignment: true,
      values: {
        __DEV__: production ? "false" : "true",
      },
    }),
    typescript({ tsconfig: "./tsconfig.build.json" }),
    nodeResolve(),
    commonjs(),
  ];
}
exports.createPlugins = createPlugins;

/**
 * @param {string} path
 */
function fileI(path) {
  try {
    const stats = fs.statSync(path);
    if (!stats.isFile()) return undefined;
    return path;
  } catch {
    return undefined;
  }
}

/** @typedef {Omit<import("rollup").OutputOptions, "file" | "format">} OutputOptions */
/** @typedef {(format: import("rollup").ModuleFormat) => OutputOptions} OutputOptionsCreator */

/**
 * @param {{
 *   file: {
 *     input: string;
 *     output: string;
 *   } | {
*     input: string;
*     outputCjs: string;
*     outputMjs: string;
*   } | string;
 *   production?: boolean;
 *   outputOptions?: OutputOptions | OutputOptionsCreator;
 * }} config
 * @returns {import("rollup").MergedRollupOptions}
 */
function createLibraryInput(config) {
  const prod = config.production ? ".prod" : "";
  const files = {
    input: config.file.input
      ?? fileI((config.file.input ?? "") + ".ts")
      ?? fileI(path.join(config.file.input ?? "", "index.ts"))
      ?? fileI(path.join("src", config.file ?? ""))
      ?? fileI(path.join("src", (config.file ?? "") + ".ts"))
      ?? fileI(path.join("src", config.file ?? "", "index.ts")),
    outputCjs: config.file.outputCjs
      ?? (config.file.output ? config.file.output + prod + ".js" : undefined)
      ?? (path.join("dist", config.file + prod + ".js")),
    outputMjs: config.file.outputMjs
      ?? (config.file.output ? config.file.output + prod + ".mjs" : undefined)
      ?? (path.join("dist", config.file + prod + ".mjs")),
  };

  const createOutputOptions = typeof config.outputOptions === "function"
    ? config.outputOptions : () => config.outputOptions;

  return {
    input: files.input,
    output: [
      {
        sourcemap: !config.production,
        ...createOutputOptions("cjs"),
        file: files.outputCjs,
        format: "cjs",
      },
      {
        sourcemap: !config.production,
        ...createOutputOptions("es"),
        file: files.outputMjs,
        format: "es",
      },
    ],
    plugins: createPlugins(config.production),
  };
}
exports.createLibraryInput = createLibraryInput;
