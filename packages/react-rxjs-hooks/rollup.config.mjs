import { createLibrary } from "@monorepo/configs/rollup.mjs";

export default createLibrary(
  {
    input: {
      index: "./src/index.ts",
      utils: "./src/utils/index.ts",
    },
    external: ["./utils"],
  },
  { bundled: ["@monorepo/utils"] }
);
