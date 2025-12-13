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
import type { TMXMap } from "./tmx-types";

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

  render({ ctx }: CanvasRendererContext, layer: string): void {
    const resource = this.#entity.resource;
    resource.renderMapLayer(ctx, layer, { tileSize: this.tileSize.value, offset: this.offset.value });
    // if (DEBUG.get("tiledMapGrid"))
    //   doWith(ctx as never as CanvasRenderingContext2D, (ctx) => {
    //     ctx.save();
    //     ctx.strokeStyle = "red";
    //     ctx.lineWidth = 1;
    //     const { w, h } = this.tileSize.value;
    //     ctx.beginPath();
    //     for (let y = 0; y < resource.map.height; y += 1) {
    //       for (let x = 0; x < resource.map.width; x += 1) {
    //         ctx.moveTo(x * w, y * h + h);
    //         ctx.lineTo(x * w, y * h);
    //         ctx.lineTo(x * w + w, y * h);
    //       }
    //     }
    //     ctx.stroke();
    //     ctx.restore();
    //   });
    // if (DEBUG.get("tiledMapCoords"))
    //   doWith(ctx as never as CanvasRenderingContext2D, (ctx) => {
    //     ctx.save();
    //     ctx.font = "8px monospace";
    //     ctx.fillStyle = "black";
    //     ctx.globalAlpha = 0.5;
    //     const { w, h } = this.tileSize.value;
    //     for (let y = 0; y < resource.map.height; y += 1) {
    //       for (let x = 0; x < resource.map.width; x += 1) {
    //         ctx.fillText(`[${x},${y}]`, x * w, y * h + 8);
    //       }
    //     }
    //     ctx.restore();
    //   });
  }
}
declare global {
  interface DebugFlags {
    tiledMapGrid: boolean;
    tiledMapCoords: boolean;
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
    const tiles: Record<"left" | "right" | "top" | "bottom", number> = {
      left: Math.floor(targetRect.x),
      right: Math.floor(targetRect.x2),
      top: Math.floor(targetRect.y),
      bottom: Math.floor(targetRect.y2),
    };
    for (const layer of map.layers) {
      if (layer.type !== "tilelayer") continue;
      const data = layersData.emplace(layer);
      for (let x = tiles.left; x <= tiles.right; x += 1) {
        for (let y = tiles.top; y <= tiles.bottom; y += 1) {
          const globalIndex = data[y * layer.height + x];
          const tileCollisions = collisions.get(globalIndex);
          if (!tileCollisions?.length) continue;
          for (const collisionTarget of tileCollisions) {
            const collision = collisionTarget.offset([x, y]).collide(targetRect);
            if (collision) yield { type: "tile", map: this.#entity, position: new Point2D(x, y), collision };
          }
        }
      }
    }
  }
}

export type TiledMapParams = EntityParams &
  ExclusiveUnion<{ filePath: string }, { map: TMXMap & { filePath: string } }> &
  OmitHelper<TiledMapEntityComponentParams, keyof EntityComponentParams>;
export class TiledMap extends Entity {
  readonly resource: TMXResource;
  readonly renderer: TMXMapRendererEntityComponent;
  readonly collision: TMXCollisionEntityComponent;

  constructor({ filePath, map, tileSize, offset, ...entityParams }: TiledMapParams) {
    super(entityParams, undefined, async (stack) => {
      stack.append(await this.resource.initialize());
    });
    this.resource = new TMXResource(map ?? filePath);
    this.renderer = new TMXMapRendererEntityComponent({ tileSize, offset, entity: this, name: "renderer" });
    this.collision = new TMXCollisionEntityComponent({ entity: this, name: "collision" });
  }
}
