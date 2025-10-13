import type { Size } from "@anion155/shared/linear/size";
import { useFabric, useStableCallback } from "@anion155/shared/react";
import type { ForwardedRef } from "react";
import { useEffect } from "react";

import type { Canvas2D } from "./canvas-layer";
import { useCanvasContext } from "./canvas-layer";
import { useRegisterEntityComponent } from "./entity";
import { useGameContext } from "./game";

export const CanvasRenderer = () => {
  const game = useGameContext();
  const { canvas, size } = useCanvasContext();
  useEffect(() => {
    return game.on("frame", (deltaTime) => {
      canvas.clearRect(0, 0, size.w, size.h);
      for (const entity of game) {
        for (const component of entity.findComponents(CanvasRendererEntityComponent)) {
          canvas.save();
          try {
            component.render(canvas, size, deltaTime);
          } finally {
            canvas.restore();
          }
        }
      }
    });
  }, [canvas, game, size]);
  return null;
};

type CanvasRendererRender = {
  (canvas: Canvas2D, canvasSize: Size, deltaTime: number): void;
};

type CanvasRendererEntityComponentProps = {
  ref?: ForwardedRef<CanvasRendererEntityComponent>;
  name?: string;
  render: CanvasRendererRender;
};
const CanvasRendererEntityComponentRegister = ({ ref, render, name }: CanvasRendererEntityComponentProps) => {
  const stableRender = useStableCallback(render);
  const component = useFabric(() => new CanvasRendererEntityComponent(stableRender, name), [name, stableRender]);
  useRegisterEntityComponent(component, ref);
  return null;
};

export class CanvasRendererEntityComponent {
  constructor(
    readonly render: CanvasRendererRender,
    readonly name = "canvasRenderer",
  ) {}

  static Register = CanvasRendererEntityComponentRegister;
}
