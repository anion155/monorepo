const commonjs = require("@rollup/plugin-commonjs").default;
const nodeResolve = require("@rollup/plugin-node-resolve").default;
const replace = require("@rollup/plugin-replace").default;
const typescript = require("@rollup/plugin-typescript").default;
const fs = require("fs");
const path = require("path");
const external = require("rollup-plugin-peer-deps-external");

/**
 * @param {boolean} production
 * @param {import("@rollup/plugin-typescript").RollupTypescriptOptions} tsconfig
 * @returns {import("rollup").Plugin[]}
 */
function createPlugins(production, tsconfig) {
  return [
    external({ includeDependencies: true }),
    replace({
      preventAssignment: true,
      values: {
        __DEV__: production ? "false" : "true",
      },
    }),
    typescript({ ...tsconfig, tsconfig: "./tsconfig.build.json" }),
    nodeResolve(),
    commonjs(),
  ];
}
exports.createPlugins = createPlugins;

/**
 * @param {string} filePath
 */
function fileI(filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) return undefined;
    return filePath;
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
 *   tsconfig?: import("@rollup/plugin-typescript").RollupTypescriptOptions;
 *   outputOptions?: OutputOptions | OutputOptionsCreator;
 * }} config
 * @param {import("rollup").MergedRollupOptions} [extension]
 * @returns {import("rollup").MergedRollupOptions}
 */
function createLibraryInput(config, extension) {
  const prod = config.production ? ".prod" : "";
  const files = {
    input:
      config.file.input ??
      fileI(`${config.file.input ?? ""}.ts`) ??
      fileI(path.join(config.file.input ?? "", "index.ts")) ??
      fileI(path.join("src", config.file ?? "")) ??
      fileI(path.join("src", `${config.file ?? ""}.ts`)) ??
      fileI(path.join("src", config.file ?? "", "index.ts")),
    outputCjs:
      config.file.outputCjs ??
      (config.file.output ? `${config.file.output + prod}.js` : undefined) ??
      path.join("dist", `${config.file + prod}.js`),
    outputMjs:
      config.file.outputMjs ??
      (config.file.output ? `${config.file.output + prod}.mjs` : undefined) ??
      path.join("dist", `${config.file + prod}.mjs`),
  };

  const createOutputOptions =
    typeof config.outputOptions === "function"
      ? config.outputOptions
      : () => config.outputOptions;

  return {
    ...extension,
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
    plugins: [
      ...createPlugins(config.production, config.tsconfig),
      ...(extension?.plugins ?? []),
    ],
  };
}
exports.createLibraryInput = createLibraryInput;
