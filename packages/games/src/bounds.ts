import { type NumberVector, type Point2D, type Rect, Size, type SizeValue } from "@anion155/linear";

import { cssColors } from "./css-colors";

export const boundsMul = (bounds: Rect, scale: NumberVector<2>) => {
  return bounds.mul([scale[0], scale[1], scale[0], scale[1]]);
};

export const drawDebugBounds = (
  ctx: CanvasState & CanvasFillStrokeStyles & CanvasCompositing & CanvasRect,
  bounds: Rect,
  style?: { color?: string; alpha?: number },
) => {
  ctx.save();
  ctx.fillStyle = style?.color ?? cssColors.black;
  ctx.globalAlpha = style?.alpha ?? 0.2;
  ctx.fillRect(...bounds.asTuple());
  ctx.restore();
};

export const drawDebugPosition = (
  ctx: CanvasState & CanvasFillStrokeStyles & CanvasCompositing & CanvasTransform & CanvasRect,
  position: Point2D,
  style?: { color?: string; alpha?: number; size?: SizeValue },
) => {
  ctx.save();
  ctx.fillStyle = style?.color ?? cssColors.red;
  ctx.globalAlpha = style?.alpha ?? 0.5;
  ctx.translate(...position.asTuple());
  const size = Size.parseValue(style?.size ?? 5);
  ctx.fillRect(-size.w / 2, -size.h / 2, size.w, size.h);
  ctx.restore();
};
