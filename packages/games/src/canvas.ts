import { Point2D } from "@anion155/linear/point-2d";
import type { Size } from "@anion155/linear/size";
import { DeveloperError } from "@anion155/shared";

import type { Point2DBindingArgument, SizeBindingArgument } from "./binding";
import { Point2DComponent, SizeComponent } from "./binding";
import type { EntityParams } from "./entity";
import { Entity, EntityComponent } from "./entity";
import { Game } from "./game";
import { LoopEntityComponent } from "./loop";

export type CanvasRendererContext = {
  game: Game;
  ctx: CanvasRenderingContext2D;
  size: Size;
  deltaTime: DOMHighResTimeStamp;
};
export type CanvasRendererLayerParams = EntityParams & {
  root: HTMLDivElement;
  layers: string[];
  size: SizeBindingArgument;
  offset?: Point2DBindingArgument;
};
export class CanvasRendererLayer extends Entity {
  readonly root: HTMLDivElement;
  readonly layers: string[];
  readonly size: SizeComponent;
  readonly offset: Point2DComponent;

  constructor({ root, layers, size, offset, ...entityParams }: CanvasRendererLayerParams) {
    super(entityParams, (stack) => {
      const canvas = document.createElement("canvas");
      const size = this.size.value;
      canvas.width = size.w;
      canvas.height = size.h;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.imageRendering = "crisp-edges";
      root.append(canvas);
      stack.append(() => canvas.remove());

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new DeveloperError("Failed to create canvas 2d context");
      ctx.imageSmoothingEnabled = false;

      const game = Game.getGame(this);
      stack.append(
        LoopEntityComponent.getGameLoop(this).on("frame", (deltaTime) => {
          this.render({ game, ctx, size, deltaTime });
        }),
      );
    });
    this.root = root;
    this.layers = layers;
    this.size = new SizeComponent({ entity: this, name: "size", initial: size });
    this.offset = new Point2DComponent({ entity: this, name: "offset", initial: offset ?? [0, 0] });
  }

  render(context: CanvasRendererContext) {
    const { ctx, game, size } = context;
    ctx.clearRect(0, 0, size.w, size.h);
    ctx.save();
    ctx.translate(...Point2D.project(size, this.offset.value)((size, position) => size / 2 - position).asTuple());
    const components = game.eachNestedComponents(CanvasRendererEntityComponent).toArray();
    components.sort((a, b) => {
      const aY = a.entity.findComponent(Point2DComponent, "position")?.value.y ?? 0;
      const bY = b.entity.findComponent(Point2DComponent, "position")?.value.y ?? 0;
      return aY - bY;
    });
    for (const layer of this.layers) {
      for (const component of components) {
        ctx.save();
        component.render(context, layer);
        ctx.restore();
      }
    }
    ctx.restore();
  }
}

export abstract class CanvasRendererEntityComponent<Value = void> extends EntityComponent<Value> {
  abstract render(context: CanvasRendererContext, layer: string): void;
}
