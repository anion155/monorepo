import { createUseContext } from "@anion155/shared/react";
import { mergeRefs } from "@anion155/shared/react/merge-refs";
import { Size } from "@anion155/shared/vectors";
import type { ComponentProps } from "react";
import { createContext, useMemo, useState } from "react";

export type Canvas2D = CanvasCompositing &
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

export type CanvasContext = { canvas: Canvas2D; size: Size };
export const CanvasContext = createContext<CanvasContext | undefined>(undefined);
export const useCanvasContext = createUseContext(CanvasContext, "CanvasContext");

type CanvasLayerProps = ComponentProps<"canvas">;
export const CanvasLayer = ({ ref, children, ...props }: CanvasLayerProps) => {
  const [canvas, setCanvas] = useState<CanvasRenderingContext2D | null>(null);
  const context = useMemo<CanvasContext | null>(() => canvas && { canvas, size: new Size(canvas.canvas) }, [canvas]);
  return (
    <>
      <canvas {...props} ref={mergeRefs(ref, (canvas) => setCanvas(canvas?.getContext("2d") ?? null))} />
      {context ? <CanvasContext.Provider value={context}>{children}</CanvasContext.Provider> : null}
    </>
  );
};
