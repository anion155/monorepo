import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

import external from "./external-dependencies.mjs";

export const plugins = {
  commonjs,
  nodeResolve,
  replace,
  typescript,
  dts,
  external,
};

/**
 * @typedef {{
 *  production?: boolean;
 *  bundled?: import("./external-dependencies.mjs").ExternalOption;
 * }} Config
 */

/**
 * @param {Config} [config]
 * @returns {import("rollup").Plugin[]}
 */
export function createPlugins(config) {
  return [
    external({ bundled: config?.bundled }),
    replace({
      preventAssignment: true,
      values: {
        __DEV__: config?.production ? "false" : "true",
      },
    }),
    typescript({ tsconfig: "./tsconfig.build.json" }),
    nodeResolve(),
    commonjs(),
  ];
}

/** @returns {import("rollup").Plugin[]} */
export function createDtsPlugins() {
  return [dts({ tsconfig: "./tsconfig.build.json" })];
}

/**
 * @typedef {`${string}.${import("rollup").InternalModuleFormat}.js`} ModulePath
 */
/**
 * @typedef {Omit<import("rollup").RollupOptions, 'output'> & {
 *  output: import("rollup").OutputOptions | ModulePath | Array<import("rollup").OutputOptions | ModulePath>;
 * }} RollupOptions
 */

const extensionToFormatMap = {
  js: "cjs",
  mjs: "es",
};

/**
 * @param {import("rollup").OutputOptions | ModulePath} output
 * @param {Config} [config]
 * @returns {import("rollup").OutputOptions}
 */
export function createOutput(output, config) {
  const sourcemap = !config?.production;

  if (typeof output !== "string") return output;

  let found = /^(?<path>.*\/)?(?<name>.*)$/.exec(output);
  if (!found) return { file: output, format: "cjs", sourcemap };
  const { path, name } = found.groups;

  found = /\.((?<format>amd|cjs|es|iife|system|umd)\.)?(?<extension>.*)$/.exec(
    name
  );
  const { extension, format = extensionToFormatMap[extension] ?? "cjs" } =
    found?.groups ?? {};

  if (/\[name\]/.test(name)) {
    return {
      dir: path,
      entryFileNames: name,
      format,
      sourcemap,
    };
  }
  return {
    file: output,
    format,
    sourcemap,
  };
}

/**
 * @param {RollupOptions} options
 * @param {Config} [config]
 * @returns {import("rollup").RollupOptions}
 */
export function createInput({ output: outputString, ...options }, config) {
  const output = Array.isArray(outputString)
    ? outputString.map((o) => createOutput(o, config))
    : createOutput(outputString, config);

  return {
    plugins: createPlugins(config),
    ...options,
    output,
  };
}

/**
 * @param {RollupOptions} options
 * @param {Config} [config]
 * @returns {import("rollup").RollupOptions}
 */
export function createInputWithUtils(options, config) {
  return createInput(options, { bundled: ["@monorepo/utils"], ...config });
}

/**
 * @param {RollupOptions} options
 * @returns {import("rollup").RollupOptions}
 */
export function createDtsInput(options) {
  const plain = "./dist/types.d.ts";
  const pattern = "./dist/types/[name].d.ts";
  const output = createOutput(
    typeof options.input === "object" ? pattern : plain,
    { production: true }
  );

  return {
    plugins: createDtsPlugins(),
    ...options,
    output,
  };
}

/**
 * @param {import("rollup").RollupOptions} options
 * @param {Config} [config]
 * @returns {import("rollup").RollupOptions[]}
 */
export function createLibrary(options, config) {
  /** @type {(env: string, ext: string) => string} */
  let output;
  if (typeof options.input === "object") {
    output = (env, ext) => `./dist/${env}/[name].${ext}`;
  } else {
    const result = /^\.\/src\/(?<path>.*)\.([^/]*)$/.exec(options.input);
    const path = result?.groups.path;
    if (path) {
      output = (env, ext) => `./dist/${env}/${path}.${ext}`;
    } else {
      output = () => undefined;
    }
  }

  return [
    createDtsInput(options),

    createInputWithUtils(
      {
        output: [output("dev", "js"), output("dev", "mjs")],
        ...options,
      },
      config
    ),
    createInputWithUtils(
      {
        output: [output("prod", "js"), output("prod", "mjs")],
        ...options,
      },
      { ...config, production: true }
    ),
  ];
}
