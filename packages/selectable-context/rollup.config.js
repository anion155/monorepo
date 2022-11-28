import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import external from "rollup-plugin-peer-deps-external";

/** @type {import("rollup").Plugin[]} */
const plugins = [
  external({ includeDependencies: true }),
  replace({
    preventAssignment: true,
    values: {
      __DEV__: "(process.env.NODE_ENV !== 'production')",
    },
  }),
  typescript(),
  nodeResolve(),
  commonjs(),
];

/** @type {import('rollup').MergedRollupOptions[]} */
const config = [
  {
    input: "./src/internal.ts",
    output: {
      file: "./dist/internal.js",
      format: "cjs",
      sourcemap: false,
    },
    plugins,
  },
  {
    input: "./src/index.ts",
    output: {
      file: "./dist/index.js",
      format: "cjs",
      sourcemap: true,
    },
    external: ["./internal"],
    plugins,
  },
];

export default config;
