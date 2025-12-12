import path from "node:path";

import { imageSizeFromFile } from "image-size/fromFile";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: "image-assets",
      async transform(src, id) {
        const suffix = "?image";
        if (!id.endsWith(suffix)) return;
        const url = path.relative(process.cwd(), id.slice(0, -suffix.length));
        const { width, height, type } = await imageSizeFromFile(url);
        const code = `const asset = ${JSON.stringify({ url: "/" + url, width, height, type })}; export default asset;`;
        return { code, map: null };
      },
    },
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  esbuild: {
    target: "safari18",
  },
});
