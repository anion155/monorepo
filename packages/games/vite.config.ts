import path from "node:path";

import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vanillaExtractPlugin()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  esbuild: {
    target: "safari18",
  },
});
