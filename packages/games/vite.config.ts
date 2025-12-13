import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

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
        const url = relative(process.cwd(), id.slice(0, -suffix.length));
        const { width, height, type } = await imageSizeFromFile(url);
        const code = `const asset = ${JSON.stringify({ url: "/" + url, width, height, type })}; export default asset;`;
        return { code, map: null };
      },
    },
    {
      name: "tmx-assets",
      async transform(src, id) {
        const suffix = "?tmx";
        if (!id.endsWith(suffix)) return;
        const filePath = relative(process.cwd(), id.slice(0, -suffix.length));
        const file = id.slice(0, -suffix.length);
        const json = await readFile(file, "utf-8");
        const code = `const asset = ${json}; const filePath = ${JSON.stringify("/" + filePath)}; const module = { ...asset, filePath }; export default module;`;
        return { code, map: null };
      },
    },
  ],
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  esbuild: {
    target: "safari18",
  },
});
