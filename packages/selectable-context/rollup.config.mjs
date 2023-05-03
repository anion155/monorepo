import { createLibrary } from "@monorepo/configs/rollup.mjs";

export default createLibrary(
  {
    input: "./src/index.ts",
  },
  { bundled: ["@monorepo/utils"] }
);
