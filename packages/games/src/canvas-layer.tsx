import { Size } from "@anion155/shared/linear/size";
import { createUseContext } from "@anion155/shared/react";
import { mergeRefs } from "@anion155/shared/react/merge-refs";
import type { ComponentProps } from "react";
import { createContext, useCallback, useMemo, useState } from "react";

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
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const handleCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return setCtx(null);
    const ctx = canvas.getContext("2d");
    if (!ctx) return setCtx(null);
    ctx.imageSmoothingEnabled = false;
    setCtx(ctx);
  }, []);
  const context = useMemo<CanvasContext | null>(() => ctx && { canvas: ctx, size: new Size(ctx.canvas) }, [ctx]);
  return (
    <>
      <canvas {...props} ref={mergeRefs(ref, handleCanvas)} />
      {context ? <CanvasContext.Provider value={context}>{children}</CanvasContext.Provider> : null}
    </>
  );
};
