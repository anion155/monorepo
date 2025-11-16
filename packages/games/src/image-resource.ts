import type { Point } from "@anion155/shared/linear/point";
import type { RectValue } from "@anion155/shared/linear/rect";
import { Rect } from "@anion155/shared/linear/rect";
import type { Size, SizeValue } from "@anion155/shared/linear/size";

import { Resource } from "./resource";
import { loadImage, prepareOffscreenContext } from "./utils";

export type SourceDestParams =
  | []
  | [dest: Point | Rect]
  | [source: Rect, dest: Point]
  | [source: Point, dest: Rect]
  | [source: Rect, dest: Rect]
  | [source: Point, dest: Point, size: Size];
export const parseSourceDestParams = (original: Rect, params: SourceDestParams) => {
  if (params.length === 3) {
    const [source, dest, size] = params;
    return {
      source: new Rect(original.x + source.x, original.y + source.y, size.w, size.h),
      dest: new Rect(dest.x, dest.y, size.w, size.h),
    };
  } else if (params.length === 2) {
    const [source, dest] = params;
    let sourceSize: Size | undefined;
    let destSize: Size | undefined;
    if (source instanceof Rect) sourceSize = source.size;
    else sourceSize = (dest as Rect).size;
    if (dest instanceof Rect) destSize = dest.size;
    else destSize = (source as Rect).size;
    return {
      source: new Rect(original.x + source.x, original.y + source.y, sourceSize.w, sourceSize.h),
      dest: new Rect(dest.x, dest.y, destSize.w, destSize.h),
    };
  } else if (params.length === 1) {
    if (params[0] instanceof Rect) {
      const [dest] = params;
      return { source: original, dest };
    }
    const [dest] = params;
    return { source: original, dest: new Rect(dest.x, dest.y, original.w, original.h) };
  } else {
    return { source: original, dest: new Rect(0, 0, original.w, original.h) };
  }
};

export type ImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas;
export type ImageResourceParam =
  | string
  | ImageSource
  | ImageResource
  | [size: SizeValue, { (ctx: OffscreenCanvasRenderingContext2D): Promise<void> | void }];
export class ImageResource extends Resource<{ readonly source: Readonly<ImageSource>; readonly rect: Rect }> {
  static parse(src: ImageResourceParam) {
    if (src instanceof ImageResource) return src;
    return new ImageResource(src);
  }
  constructor(src: ImageResourceParam, predefinedRect?: RectValue) {
    super(async (stack) => {
      let _src;
      if (Array.isArray(src)) {
        const [size, draw] = src;
        const ctx = prepareOffscreenContext(size);
        await draw(ctx);
        _src = ctx.canvas.transferToImageBitmap();
      } else {
        _src = src;
      }

      let source: Readonly<ImageSource>;
      if (_src instanceof ImageResource) {
        await _src.initialize();
        source = _src.source;
      } else if (_src instanceof ImageBitmap) {
        const bitmap = _src;
        stack.append(() => bitmap.close());
        source = bitmap;
      } else if (typeof _src === "string") {
        source = await loadImage(_src);
      } else {
        source = _src;
      }
      const rect = predefinedRect !== undefined ? Rect.parseValue(predefinedRect) : new Rect(0, source);
      return { source, rect };
    });
  }

  get source() {
    return this.initializer.value.source;
  }
  get rect() {
    return this.initializer.value.rect;
  }

  renderImage(ctx: CanvasDrawImage, ...params: SourceDestParams): void {
    const { source, dest } = parseSourceDestParams(this.rect, params);
    ctx.drawImage(this.source, source.x, source.y, source.w, source.h, dest.x, dest.y, dest.w, dest.h);
  }
}
