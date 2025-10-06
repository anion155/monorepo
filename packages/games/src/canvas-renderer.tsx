import type { Size } from "@anion155/shared/linear/size";
import { useStableCallback } from "@anion155/shared/react";
import { useEffect, useMemo } from "react";

import type { Canvas2D } from "./canvas-layer";
import { useCanvasContext } from "./canvas-layer";
import { createEntityComponent } from "./entity";
import { useGameContext } from "./game";

export const CanvasRenderer = () => {
  const game = useGameContext();
  const { canvas, size } = useCanvasContext();
  useEffect(() => {
    return game.on("frame", (deltaTime) => {
      canvas.clearRect(0, 0, size.w, size.h);
      for (const entity of game) {
        const canvasComponent = CanvasRendererEntityComponent.get(entity);
        if (canvasComponent) {
          canvas.save();
          try {
            canvasComponent.render(canvas, size, deltaTime);
          } finally {
            canvas.restore();
          }
        }
      }
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
