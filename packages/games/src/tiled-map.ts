import type { PointValue } from "@anion155/shared/linear/point";
import { Point } from "@anion155/shared/linear/point";
import type { Rect } from "@anion155/shared/linear/rect";
import type { SizeValue } from "@anion155/shared/linear/size";
import { Size } from "@anion155/shared/linear/size";
import { SignalBinding } from "@anion155/signals";

import type { CanvasRendererContext } from "./canvas";
import { CanvasRendererEntityComponent } from "./canvas";
import type { CollisionResults } from "./collision";
import { CollisionEntityComponent } from "./collision";
import type { EntityComponentParams, EntityParams } from "./entity";
import { Entity } from "./entity";
import { TMXResource } from "./tmx-resource";

export type TiledMapEntityComponentParams = OmitHelper<EntityComponentParams, "entity"> & {
  entity: TiledMap;
  tileSize?: SizeValue;
  offset?: PointValue;
};

export class TMXMapRendererEntityComponent extends CanvasRendererEntityComponent<void> {
  get #entity() {
    return this.entity as TiledMap;
  }
  readonly tileSize: SignalBinding<Size | undefined>;
  readonly offset: SignalBinding<Point | undefined>;

  constructor({ tileSize, offset, ...params }: TiledMapEntityComponentParams) {
    super(params);
    this.tileSize = new SignalBinding(tileSize !== undefined ? Size.parseValue(tileSize) : undefined);
    this.offset = new SignalBinding(offset !== undefined ? Point.parseValue(offset) : undefined);
  }

  render({ ctx }: CanvasRendererContext): void {
    this.#entity.resource.renderMap(ctx, { tileSize: this.tileSize.value, offset: this.offset.value });
  }
}

declare global {
  interface CollisionsMap {
    tile: { position: Point; collision: Rect };
  }
}
export class TMXCollisionEntityComponent extends CollisionEntityComponent<void> {
  get #entity() {
    return this.entity as TiledMap;
  }

  constructor(params: TiledMapEntityComponentParams) {
    super(params);
  }

  *collide(targetRect: Rect): CollisionResults {
    const { map, layersData, collisions } = this.#entity.resource;
    const leftTile = Math.floor(targetRect.x);
    const rightTile = Math.ceil(targetRect.x2);
    const topTile = Math.floor(targetRect.y);
    const bottomTile = Math.ceil(targetRect.y + targetRect.h);
    for (const layer of map.layers) {
      if (layer.type !== "tilelayer") continue;
      const data = layersData.emplace(layer);
      for (let x = leftTile; x <= rightTile; x += 1) {
        for (let y = topTile; y <= bottomTile; y += 1) {
          const globalIndex = data[y * layer.height + x];
          const tileCollisions = collisions.get(globalIndex);
          if (!tileCollisions?.length) continue;
          for (const collisionTarget of tileCollisions) {
            const collision = collisionTarget.collide(targetRect);
            if (collision) yield { type: "tile", position: new Point(x, y), collision };
          }
        }
      }
    }
  }
}

export type TiledMapParams = EntityParams & {
  filePath: string;
} & OmitHelper<TiledMapEntityComponentParams, keyof EntityComponentParams>;
export class TiledMap extends Entity {
  readonly resource: TMXResource;
  readonly renderer: TMXMapRendererEntityComponent;
  readonly collision: TMXCollisionEntityComponent;

  constructor({ filePath, tileSize, offset, ...entityParams }: TiledMapParams) {
    super(entityParams);
    this.resource = new TMXResource(filePath);
    this.renderer = new TMXMapRendererEntityComponent({ tileSize, offset, entity: this, name: "renderer" });
    this.collision = new TMXCollisionEntityComponent({ entity: this, name: "collision" });
  }
}
