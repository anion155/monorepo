import { createLibraryInput } from "@monorepo/configs/rollup";

/** @type {import('rollup').MergedRollupOptions[]} */
const config = [
  createLibraryInput(
    {
      file: "index",
      tsconfig: { declaration: true, declarationDir: "./dist/types" },
    },
    { external: ["./internal"] }
  ),
  createLibraryInput(
    {
      file: "index",
      tsconfig: { declaration: true, declarationDir: "./dist/types" },
    },
    { external: ["./internal"] }
  ),
  createLibraryInput({ file: "internal" }, { sourcemap: false }),

  createLibraryInput(
    { file: "index", production: true },
    { external: ["./internal"] }
  ),
  createLibraryInput({ file: "utils", production: true }),
];

export default config;
