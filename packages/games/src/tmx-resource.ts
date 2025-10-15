import { DeveloperError, TODO } from "@anion155/shared";
import { Point } from "@anion155/shared/linear/point";
import { Rect } from "@anion155/shared/linear/rect";
import { Size } from "@anion155/shared/linear/size";

import type { Canvas2D } from "./canvas-layer";
import { loadImage } from "./image-resource";
import { SpritesResource } from "./sprites-resource";
import type { TMXMap, TMXTileLayer } from "./tmx";

export class TMXResource {
  static async fromFile(filePath: string) {
    const response = await fetch(filePath);
    const tmx = (await response.json()) as TMXMap;
    const images: HTMLImageElement[] = [];
    for (const tileset of tmx.tilesets) {
      if (!tileset.image) throw new DeveloperError("TMX: tileset without image is not suppoerted");
      images.push(await loadImage(filePath.substring(0, filePath.lastIndexOf("/")) + "/" + tileset.image));
    }
    return new TMXResource(tmx, images);
  }

  readonly sprites: readonly SpritesResource[];
  readonly gids: readonly number[];
  readonly tileSize: Size;
  readonly dataMap: WeakMapWithFabric<TMXTileLayer, Uint16Array<ArrayBufferLike>>;
  constructor(
    readonly tmx: TMXMap,
    images: HTMLImageElement[],
  ) {
    const sprites = [];
    const gids = [];
    for (let index = 0; index < tmx.tilesets.length; index += 1) {
      const tileset = tmx.tilesets[index];
      if (!images[index]) throw new DeveloperError("TMX: tileset without image is not suppoerted");
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
      const sprite = new SpritesResource(images[index], {
        spriteSize: new Size(tilewidth, tileheight),
        size: new Size(columns, Math.ceil(tilecount / columns)),
        offset: new Point(offsetx + margin, offsety + margin),
        gaps: new Size(spacing + margin * 2, spacing + margin * 2),
      });
      gids.push(firstgid);
      sprites.push(sprite);
    }
    this.sprites = sprites;
    this.gids = gids;
    this.tileSize = new Size(tmx.tilewidth, tmx.tileheight);

    this.dataMap = new WeakMap.withFabric((layer: TMXTileLayer): Uint16Array => {
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
  }

  readonly globalIndexes = new Map.withFabric((globalIndex: number) => {
    const spritesIndex = this.sprites.findIndex((_, index) => globalIndex >= this.gids[index]);
    if (spritesIndex < 0) return undefined;
    const spriteIndex = globalIndex - this.gids[spritesIndex];
    return [spritesIndex, spriteIndex] as const;
  });
  readonly asImageResources = new Map.withFabric((globalIndex: number) => {
    const indexes = this.globalIndexes.emplace(globalIndex);
    if (!indexes) return undefined;
    return this.sprites[indexes[0]].asImageResources.emplace(indexes[1]);
  });

  renderMap(canvas: Canvas2D, tileSize: Size = this.tileSize) {
    for (const layer of this.tmx.layers) {
      if (!layer.visible || layer.opacity === 0) continue;
      if (layer.type === "tilelayer") {
        canvas.save();
        if (layer.opacity !== undefined) canvas.globalAlpha = layer.opacity;
        const data = this.dataMap.emplace(layer);
        for (let y = layer.y ?? 0; y < layer.height; y += 1) {
          for (let x = layer.x ?? 0; x < layer.width; x += 1) {
            const indexes = this.globalIndexes.emplace(data[y * layer.height + x]);
            if (!indexes) continue;
            const dest = new Rect(x * tileSize.w, y * tileSize.h, tileSize.w, tileSize.h);
            this.sprites[indexes[0]].renderSprite(canvas, indexes[1], dest);
          }
        }
        canvas.restore();
      } else if (layer.type === "objectgroup") {
        // TODO
      } else {
        TODO(`TMX: layer type '${layer.type}' is not supported`);
      }
    }
  }
}
