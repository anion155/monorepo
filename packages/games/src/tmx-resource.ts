import type { Point2DValue } from "@anion155/linear/point-2d";
import { Point2D } from "@anion155/linear/point-2d";
import { Rect } from "@anion155/linear/rect";
import type { SizeValue } from "@anion155/linear/size";
import { Size } from "@anion155/linear/size";
import { DeveloperError, TODO } from "@anion155/shared";
import { OrderedMap } from "@anion155/shared/ordered-map";

import { ImageResource } from "./image-resource";
import { Resource } from "./resource";
import { SpritesResource } from "./sprites-resource";
import type * as TMX from "./tmx-types";
import { loadJSON } from "./utils";

export const parseTMXMap = (map: TMX.TMXMap, path: string) => {
  const tileSize = new Size(map.tilewidth, map.tileheight);

  const gids: number[] = [];
  const globalIndexes = new Map.withFabric((globalIndex: number) => {
    const spritesIndex = sprites.findIndex((_, index) => globalIndex >= gids[index]);
    if (spritesIndex < 0) return undefined;
    const spriteIndex = globalIndex - gids[spritesIndex];
    return [spritesIndex, spriteIndex] as const;
  });

  const sprites: SpritesResource[] = [];
  for (let index = 0; index < map.tilesets.length; index += 1) {
    const tileset = map.tilesets[index];
    if (!tileset.image) throw new DeveloperError("TMX: tileset without image is not suppoerted");
    const {
      imagewidth,
      imageheight,
      firstgid = 0,
      columns,
      tilecount,
      tileoffset: { x: offsetx = 0, y: offsety = 0 } = {},
      margin = 0,
      spacing = 0,
    } = tileset;
    const sprite = new SpritesResource({
      src: [[imagewidth, imageheight], path + "/" + tileset.image],
      spriteSize: tileSize,
      size: new Size(columns, Math.ceil(tilecount / columns)),
      offset: new Point2D(offsetx + margin, offsety + margin),
      gaps: new Size(spacing + margin * 2, spacing + margin * 2),
    });
    gids.push(firstgid);
    sprites.push(sprite);
  }

  const layersData = new WeakMap.withFabric((layer: TMX.TMXTileLayer): Uint16Array => {
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

  const collisions = new Map.withFabric<number, Rect[]>(() => []);
  map.tilesets.forEach((tileset) =>
    tileset.tiles?.forEach((tile) => {
      tile.objectgroup?.objects?.map(({ x, y, width, height }) => {
        if (x === undefined) return;
        x /= tileSize.w;
        if (tile.x) x += tile.x;
        if (y === undefined) return;
        y /= tileSize.h;
        if (tile.y) y += tile.y;
        if (width === undefined) return;
        width /= tileSize.w;
        if (height === undefined) return;
        height /= tileSize.h;
        collisions.emplace(tile.id + tileset.firstgid).push(new Rect({ x, y, width, height }));
      });
    }),
  );

  return { map, tileSize, globalIndexes, sprites, layersData, collisions };
};
export type ParsedTMXMap = ReturnType<typeof parseTMXMap>;

export type TMXResourceParam = string | TMXResource;
export type TMXLayerImage = {
  image: ImageResource;
  offset: Point2D;
};
export class TMXResource extends Resource<ParsedTMXMap & { layers: OrderedMap<string, TMXLayerImage> }> {
  static parse(resource: TMXResourceParam) {
    if (resource instanceof TMXResource) return resource;
    return new TMXResource(resource);
  }

  static async drawTileLayer(ctx: CanvasDrawImage, layer: TMX.TMXTileLayer, { tileSize, globalIndexes, sprites, layersData }: ParsedTMXMap) {
    const data = layersData.emplace(layer);
    for (let y = layer.y ?? 0; y < layer.height; y += 1) {
      for (let x = layer.x ?? 0; x < layer.width; x += 1) {
        const globalIndex = data[y * layer.height + x];
        const indexes = globalIndexes.emplace(globalIndex);
        if (!indexes) continue;
        const dest = new Rect([x * tileSize.w, y * tileSize.h], tileSize);
        const sprite = sprites[indexes[0]];
        await sprite.initialize();
        sprite.renderSprite(ctx, indexes[1], dest);
      }
    }
  }

  constructor(param: string | (TMX.TMXMap & { filePath: string })) {
    super(async (stack) => {
      let map: TMX.TMXMap;
      let filePath: string;
      if (typeof param === "string") {
        map = await loadJSON<TMX.TMXMap>(param);
        filePath = param;
      } else {
        ({ filePath, ...map } = param);
      }
      const base = filePath.substring(0, filePath.lastIndexOf("/"));
      const parsed = parseTMXMap(map, base);
      await Promise.all(parsed.sprites.map(async (sprite) => stack.append(await sprite.initialize())));

      const layers = new OrderedMap<string, TMXLayerImage>();
      for (const layer of map.layers) {
        if (!layer.visible || layer.opacity === 0 || !layer.name) {
          // do nothimg
        } else if (layer.type === "tilelayer") {
          const image = new ImageResource([
            parsed.tileSize.mul(layer),
            async (ctx) => {
              if (layer.opacity !== undefined) ctx.globalAlpha = layer.opacity;
              await TMXResource.drawTileLayer(ctx, layer, parsed);
            },
          ]);
          layers.push(layer.name, { image, offset: new Point2D(layer.offsetx ?? 0, layer.offsety ?? 0) });
        } else if (layer.type === "objectgroup") {
          // TODO
        } else if (layer.type === "imagelayer") {
          // TODO
        } else {
          TODO(`TMX: layer type '${layer.type}' is not supported`);
        }
      }
      await Promise.all(
        layers.values().map(async (layer) => {
          stack.append(await layer.image.initialize());
        }),
      );

      return { ...parsed, layers };
    });
  }
  get map() {
    return this.initializer.value.map;
  }
  get tileSize() {
    return this.initializer.value.tileSize;
  }
  get globalIndexes() {
    return this.initializer.value.globalIndexes;
  }
  get sprites() {
    return this.initializer.value.sprites;
  }
  get layersData() {
    return this.initializer.value.layersData;
  }
  get collisions() {
    return this.initializer.value.collisions;
  }
  get layers() {
    return this.initializer.value.layers;
  }

  renderMap(ctx: CanvasDrawImage, { offset = [0, 0], tileSize = this.tileSize }: RenderMapParams = {}) {
    const dest = new Rect(offset, Size.parseValue(tileSize).mul(this.map));
    this.layers.values().forEach((layer) => layer.image.renderImage(ctx, dest));
  }
  renderMapLayer(ctx: CanvasDrawImage, layerName: string, { offset = [0, 0], tileSize = this.tileSize }: RenderMapParams = {}) {
    const layer = this.layers.get(layerName);
    if (!layer) return;
    const dest = new Rect(offset, Size.parseValue(tileSize).mul(this.map));
    layer.image.renderImage(ctx, dest);
  }
}
type RenderMapParams = { offset?: Point2DValue; tileSize?: SizeValue };
