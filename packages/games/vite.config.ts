import path from "node:path";

import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  esbuild: {
    target: "safari18",
  },
});
