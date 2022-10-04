import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import external from "rollup-plugin-peer-deps-external";

import pkg from "./package.json";

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
    input: pkg.exports["./internal"].types,
    output: {
      file: pkg.exports["./internal"].require,
      format: "cjs",
      sourcemap: false,
    },
    plugins,
  },
  {
    input: pkg.exports["."].types,
    output: {
      file: pkg.exports["."].require,
      format: "cjs",
      sourcemap: true,
    },
    external: ["./internal"],
    plugins,
  },
];

export default config;
