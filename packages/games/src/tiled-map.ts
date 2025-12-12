import { Point2D } from "@anion155/linear/point-2d";
import type { Rect } from "@anion155/linear/rect";

import type { Point2DBindingArgument, SizeBindingArgument } from "./binding";
import { Point2DComponent, SizeComponent } from "./binding";
import type { CanvasRendererContext } from "./canvas";
import { CanvasRendererEntityComponent } from "./canvas";
import type { CollisionResults } from "./collision";
import { CollisionEntityComponent } from "./collision";
import type { EntityComponentParams, EntityParams } from "./entity";
import { Entity } from "./entity";
import { TMXResource } from "./tmx-resource";

export type TiledMapEntityComponentParams = OmitHelper<EntityComponentParams, "entity"> & {
  entity: TiledMap;
  tileSize?: SizeBindingArgument<null>;
  offset?: Point2DBindingArgument<null>;
};

export class TMXMapRendererEntityComponent extends CanvasRendererEntityComponent<void> {
  get #entity() {
    return this.entity as TiledMap;
  }
  readonly tileSize: SizeComponent<null>;
  readonly offset: Point2DComponent<null>;

  constructor({ tileSize, offset, ...params }: TiledMapEntityComponentParams) {
    super(params);
    this.tileSize = new SizeComponent({ entity: params.entity, initial: tileSize });
    this.offset = new Point2DComponent({ entity: params.entity, initial: offset });
  }

  render({ ctx }: CanvasRendererContext): void {
    this.#entity.resource.renderMap(ctx, { tileSize: this.tileSize.value, offset: this.offset.value });
  }
}

declare global {
  interface CollisionsMap {
    tile: { map: TiledMap; position: Point2D; collision: Rect };
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
            if (collision) yield { type: "tile", map: this.#entity, position: new Point2D(x, y), collision };
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
    super(entityParams, undefined, async (stack) => {
      stack.append(await this.resource.initialize());
    });
    this.resource = new TMXResource(filePath);
    this.renderer = new TMXMapRendererEntityComponent({ tileSize, offset, entity: this, name: "renderer" });
    this.collision = new TMXCollisionEntityComponent({ entity: this, name: "collision" });
  }
}
