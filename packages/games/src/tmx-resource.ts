import { DeveloperError, TODO } from "@anion155/shared";
import { Point } from "@anion155/shared/linear/point";
import { Rect } from "@anion155/shared/linear/rect";
import { Size } from "@anion155/shared/linear/size";

import { ImageResource, loadImage } from "./image-resource";
import { SpritesResource } from "./sprites-resource";
import type { TMXMap, TMXTileLayer } from "./tmx";

export class TMXResource {
  static async fromFile(filePath: string) {
    const response = await fetch(filePath);
    const tmx = (await response.json()) as TMXMap;
    const sprites: SpritesResource[] = [];
    const gids: number[] = [];
    for (let index = 0; index < tmx.tilesets.length; index += 1) {
      const tileset = tmx.tilesets[index];
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
      const sprite = new SpritesResource(image, {
        spriteSize: new Size(tilewidth, tileheight),
        size: new Size(columns, Math.ceil(tilecount / columns)),
        offset: new Point(offsetx + margin, offsety + margin),
        gaps: new Size(spacing + margin * 2, spacing + margin * 2),
      });
      gids.push(firstgid);
      sprites.push(sprite);
    }
    const tileSize = new Size(tmx.tilewidth, tmx.tileheight);

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
    const globalIndexes = new Map.withFabric((globalIndex: number) => {
      const spritesIndex = sprites.findIndex((_, index) => globalIndex >= gids[index]);
      if (spritesIndex < 0) return undefined;
      const spriteIndex = globalIndex - gids[spritesIndex];
      return [spritesIndex, spriteIndex] as const;
    });

    const layers: Array<ImageResource | null> = [];
    for (const layer of tmx.layers) {
      if (!layer.visible || layer.opacity === 0) {
        layers.push(null);
        continue;
      }
      if (layer.type === "tilelayer") {
        const canvas = new OffscreenCanvas(tmx.width * tileSize.w, tmx.height * tileSize.h);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new DeveloperError("Failed to create OffscreenCanvas 2D context");
        if (layer.opacity !== undefined) ctx.globalAlpha = layer.opacity;
        const data = dataMap.emplace(layer);
        for (let y = layer.y ?? 0; y < layer.height; y += 1) {
          for (let x = layer.x ?? 0; x < layer.width; x += 1) {
            const indexes = globalIndexes.emplace(data[y * layer.height + x]);
            if (!indexes) continue;
            const dest = new Rect(x * tileSize.w, y * tileSize.h, tileSize.w, tileSize.h);
            sprites[indexes[0]].renderSprite(ctx, indexes[1], dest);
          }
        }
        const blob = await canvas.convertToBlob({ type: "image/png", quality: 1 });
        const image = await loadImage(URL.createObjectURL(blob));
        layers.push(new ImageResource(image));
      } else if (layer.type === "objectgroup") {
        // TODO
        layers.push(null);
      } else {
        TODO(`TMX: layer type '${layer.type}' is not supported`);
      }
    }
    return new TMXResource(layers);
  }

  constructor(readonly layers: Array<ImageResource | null>) {}

  renderMap(ctx: CanvasState & CanvasCompositing & CanvasDrawImage, dest: Rect | Point = new Point(0, 0)) {
    for (const layer of this.layers) {
      if (!layer) continue;
      layer.renderImage(ctx, dest);
    }
  }
}
