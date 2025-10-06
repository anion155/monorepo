import { DeveloperError, TODO } from "@anion155/shared";
import { Point, Rect, Size } from "@anion155/shared/vectors";

import type { Canvas2D } from "./canvas-layer";
import { createSpritesResource, loadImage, type SpritesResource } from "./image-resource";
import type { TMXMap, TMXTileLayer } from "./tmx";

export const createTMXResource = async (filePath: string) => {
  let map: TMXMap;
  {
    const response = await fetch(filePath);
    const json: unknown = await response.json();
    map = json as TMXMap;
  }

  const sprites: SpritesResource[] = [];
  const gids = [] as number[];
  for (const tileset of map.tilesets) {
    if (!tileset.image) throw new DeveloperError("TMX: tileset without image is not suppoerted");
    const image = await loadImage(filePath.substring(0, filePath.lastIndexOf("/")) + "/" + tileset.image);
    const {
      firstgid = 0,
      tilewidth,
      tileheight,
      columns,
      tilecount,
      tileoffset: { x: offsetx = 0, y: offsety = 0 } = {},
      margin = 0,
      spacing = 0,
    } = tileset;
    const sprite = createSpritesResource(image, {
      spriteSize: new Size(tilewidth, tileheight),
      size: new Size(columns, Math.ceil(tilecount / columns)),
      offset: new Point(offsetx + margin, offsety + margin),
      gaps: new Size(spacing + margin * 2, spacing + margin * 2),
    });
    gids.push(firstgid);
    sprites.push(sprite);
  }

  const dataMap = new WeakMap.withFabric((layer: TMXTileLayer): Uint16Array => {
    const encoding = layer.encoding ?? "csv";
    if (Array.isArray(layer.data)) {
      if (encoding !== "csv") throw new DeveloperError(`TMX: json array data does not support with '${layer.encoding}' encoding`);
      if (layer.compression) throw new DeveloperError("TMX: json array data does not support compression");
      return new Uint16Array(layer.data);
    }
    if (layer.encoding !== "bas64") throw new DeveloperError(`TMX: string data does not support with '${layer.encoding}' encoding`);
    const data = Buffer.from(layer.data, "base64");
    if (layer.compression) TODO("TMX: data compression is not supported");
    return new Uint16Array(data);
  });
  const render = (canvas: Canvas2D, tileSize: Size = new Size(map.tilewidth, map.tileheight)) => {
    for (const layer of map.layers) {
      if (!layer.visible || layer.opacity === 0) continue;
      if (layer.type === "tilelayer") {
        canvas.save();
        if (layer.opacity !== undefined) canvas.globalAlpha = layer.opacity;
        const data = dataMap.emplace(layer);
        for (let y = layer.y ?? 0; y < layer.height; y += 1) {
          for (let x = layer.x ?? 0; x < layer.width; x += 1) {
            const gid = data[y * layer.height + x];
            const spriteIndex = sprites.findIndex((_, index) => gid >= gids[index]);
            if (spriteIndex < 0) continue;
            sprites[spriteIndex].renderSprite(canvas, gid - gids[spriteIndex], new Rect(x * tileSize.w, y * tileSize.h, tileSize.w, tileSize.h));
          }
        }
        canvas.restore();
      } else {
        TODO(`TMX: layer type '${layer.type}' is not supported`);
      }
    }
  };

  return { tmx: map, render };
};
export type TMXResource = Awaited<ReturnType<typeof createTMXResource>>;
