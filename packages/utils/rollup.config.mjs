import {
  createInput,
  createDtsInput,
  plugins,
} from "@monorepo/configs/rollup.mjs";

/** @type {import('rollup').RollupOptions[]} */
const config = [
  createDtsInput({ input: "./src/index.ts" }),

  createInput({
    input: "./src/index.ts",
    output: ["./dist/index.js", "./dist/index.mjs"],
    plugins: [plugins.typescript({ tsconfig: "./tsconfig.build.json" })],
  }),
];

export default config;
