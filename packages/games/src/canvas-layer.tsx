import { Size } from "@anion155/shared/vectors";
import type { JSX } from "react";
import { useEffect, useId, useRef } from "react";
import { unstable_createElement } from "react-native-web";

import type { IEntities } from "./entities";
import { createEntityComponent } from "./entity";
import { useGameContext } from "./game";

export type CanvasContext2D = CanvasCompositing &
  CanvasDrawImage &
  CanvasDrawPath &
  CanvasFillStrokeStyles &
  CanvasFilters &
  CanvasImageData &
  CanvasImageSmoothing &
  CanvasPath &
  CanvasPathDrawingStyles &
  CanvasRect &
  CanvasShadowStyles &
  CanvasState &
  CanvasText &
  CanvasTextDrawingStyles &
  CanvasTransform;

export const CanvasLayer = () => {
  console.log("GG CanvasLayer", useId());
  const game = useGameContext();
  const ctxRef = useRef<CanvasRenderingContext2D>(null);
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const size = new Size(ctx.canvas);
    return game.on("frame", () => {
      const traverse = (entities: IEntities) => {
        for (const entity of entities) {
          const canvasComponent = CanvasRendererComponent.get(entity);
          if (canvasComponent) {
            ctx.save();
            try {
              canvasComponent.render(ctx, size);
            } finally {
              ctx.restore();
            }
          }
          if (Symbol.iterator in entity) traverse(entity as never as IEntities);
        }
      };
      traverse(game);
    });
  }, [game]);
  return (
    <Canvas
      ref={(canvas) => {
        ctxRef.current = canvas?.getContext("2d") ?? null;
      }}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

const Canvas = (props: JSX.IntrinsicElements["canvas"]) => unstable_createElement("canvas", props);

export type CanvasRendererComponent = {
  render(ctx: CanvasContext2D, canvasSize: Size): void;
};
export const CanvasRendererComponent = createEntityComponent("CanvasRendererComponent", (entity, props: CanvasRendererComponent) => props);
