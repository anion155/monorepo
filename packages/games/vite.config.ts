import path from "node:path";

import { defineConfig } from "vite";
import { rnw } from "vite-plugin-rnw";

// https://vite.dev/config/
export default defineConfig({
  plugins: [rnw()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
