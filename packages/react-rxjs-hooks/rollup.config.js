import { createLibraryInput } from "@monorepo/configs/rollup";

/** @type {import('rollup').MergedRollupOptions[]} */
const config = [
  createLibraryInput(
    {
      file: "index",
      tsconfig: { declaration: true, declarationDir: "./dist/types" },
    },
    { external: ["./utils"] }
  ),
  createLibraryInput({ file: "utils" }),

  createLibraryInput(
    { file: "index", production: true },
    { external: ["./utils"] }
  ),
  createLibraryInput({ file: "utils", production: true }),
];

export default config;
