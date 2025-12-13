import "@anion155/proposal-explicit-resource-management/global";
import "@anion155/proposal-iterator-helpers/global";

import { type Rect, Size } from "@anion155/linear";
import { assert } from "@anion155/shared";

import ExampleAsset from "@/assets/test_map/example.png?image";
import { SpritesResource } from "@/sprites-resource";

// function getPixel({ data }: ImageData, index: number) {
//   return [data[index * 4 + 0], data[index * 4 + 1], data[index * 4 + 2], data[index * 4 + 3]] as const;
// }
// function getPixelx(img: ImageData, bounds: Rect) {
//   for (let y = bounds.y; y < bounds.y2; y++) {
//       for (let x = bounds.x; x < bounds.x2; x++) {
//         const pixel = getPixel(img, y * bounds.w + x);

//       }
//     }
// }

async function main() {
  const root = document.querySelector("#app");
  assert(root);
  const source = new SpritesResource({ src: ExampleAsset, spriteSize: 16 });
  await using _source = await source.initialize();
  const canvas = new OffscreenCanvas(...source.image.size.asTuple());
  const ctx = canvas.getContext("2d");
  assert(ctx);
  ctx.imageSmoothingEnabled = false;

  source.image.renderImage(ctx);
  const sourceID = ctx.getImageData(0, 0, ...source.image.size.asTuple());
  const tiles: Rect[] = [];

  const sourceSize = source.image.size;
  source.bounds.slice(0, 5).forEach((curr) => {
    const sameTiles = tiles.slice();
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const pixel = ((curr.y + y) * sourceSize.w + curr.x + x) * 4;
        const r = sourceID.data[pixel + 0];
        const g = sourceID.data[pixel + 1];
        const b = sourceID.data[pixel + 2];
        sameTiles
          .slice()
          .reverse()
          .forEach((tile, index) => {
            const pixel = ((tile.y + y) * sourceSize.w + tile.x + x) * 4;
            const diff = Math.abs(r - sourceID.data[pixel + 0]) - Math.abs(g - sourceID.data[pixel + 1]) - Math.abs(b - sourceID.data[pixel + 2]);
            if (diff > 0) sameTiles.splice(index, 1);
          });
      }
    }
    if (!sameTiles.length) tiles.push(curr);
  });
  const tilesOnLine = Math.ceil(Math.sqrt(tiles.length));
  const tilesetSize = new Size(tilesOnLine).mul(16);
  const tileset = ctx.createImageData(tilesetSize.w, tilesetSize.h, { colorSpace: "srgb" });
  tiles.forEach((tile, index) => {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const tilesetPixel = ((Math.floor(index / tilesOnLine) * 16 + y) * tilesetSize.w + (index % tilesOnLine) * 16 + x) * 4;
        const sourcePixel = ((tile.y + y) * sourceSize.w + tile.x + x) * 4;
        tileset.data[tilesetPixel + 0] = sourceID.data[sourcePixel + 0];
        tileset.data[tilesetPixel + 1] = sourceID.data[sourcePixel + 1];
        tileset.data[tilesetPixel + 2] = sourceID.data[sourcePixel + 2];
        tileset.data[tilesetPixel + 3] = sourceID.data[sourcePixel + 3];
      }
    }
  });

  canvas.width = tilesetSize.w;
  canvas.width = tilesetSize.h;
  ctx.putImageData(tileset, 0, 0);

  const img = document.createElement("img");
  img.src = URL.createObjectURL(await canvas.convertToBlob());
  img.style.imageRendering = "crisp-edges";
  img.style.objectFit = "contain";
  img.style.width = "100%";
  img.style.height = "100%";
  // img.style.scale = "10";
  root.append(img);
}
void main();
