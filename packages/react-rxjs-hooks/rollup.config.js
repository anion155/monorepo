import { createLibraryInput } from "@monorepo/config/rollup";

/** @type {import('rollup').MergedRollupOptions[]} */
const config = [
  createLibraryInput({ file: "utils" }),
  { ...createLibraryInput({ file: "index" }), external: ["./utils"] },

  createLibraryInput({ file: "utils", production: true }),
  {
    ...createLibraryInput({ file: "index", production: true }),
    external: ["./utils"],
  },
];

export default config;
