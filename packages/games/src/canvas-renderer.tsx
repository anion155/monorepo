import { useStableCallback } from "@anion155/shared/react";
import type { Size } from "@anion155/shared/vectors";
import { useEffect, useMemo } from "react";

import type { Canvas2D } from "./canvas-layer";
import { useCanvasContext } from "./canvas-layer";
import type { IEntities } from "./entities";
import { createEntityComponent } from "./entity";
import { useGameContext } from "./game";

export const CanvasRenderer = () => {
  const game = useGameContext();
  const { canvas, size } = useCanvasContext();
  useEffect(() => {
    return game.on("frame", (deltaTime) => {
      const traverse = (entities: IEntities) => {
        for (const entity of entities) {
          const canvasComponent = CanvasRendererEntityComponent.get(entity);
          if (canvasComponent) {
            canvas.save();
            try {
              canvasComponent.render(canvas, size, deltaTime);
            } finally {
              canvas.restore();
            }
          }
          if (Symbol.iterator in entity) traverse(entity as never as IEntities);
        }
      };
      canvas.clearRect(0, 0, size.w, size.h);
      traverse(game);
    });
  }, [canvas, game, size]);
  return null;
};

export type CanvasRendererEntityComponent = {
  render(canvas: Canvas2D, canvasSize: Size, deltaTime: number): void;
};
export const CanvasRendererEntityComponent = createEntityComponent(
  "CanvasRenderer",
  (props: CanvasRendererEntityComponent): CanvasRendererEntityComponent => {
    const render = useStableCallback(props.render);
    return useMemo(() => ({ render }), [render]);
  },
);
