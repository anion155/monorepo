import type { Point2D } from "@anion155/linear/point-2d";
import type { RectValue } from "@anion155/linear/rect";
import { Rect } from "@anion155/linear/rect";
import type { SizeValue } from "@anion155/linear/size";
import { Size } from "@anion155/linear/size";
import { createErrorClass, hasTypedField } from "@anion155/shared";

import { Resource } from "./resource";
import { loadImage, prepareOffscreenContext } from "./utils";

export type SourceDestParams =
  | []
  | [dest: Point2D | Rect]
  | [source: Rect, dest: Point2D]
  | [source: Point2D, dest: Rect]
  | [source: Rect, dest: Rect]
  | [source: Point2D, dest: Point2D, size: Size];
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
  | [size: SizeValue, string]
  | ImageAsset
  | ImageSource
  | ImageResource
  | [size: SizeValue, { (ctx: OffscreenCanvasRenderingContext2D): Promise<void> | void }];
export class ImageResource extends Resource<{ readonly source: Readonly<ImageSource>; readonly viewport: Rect }> {
  static parse(src: ImageResourceParam) {
    if (src instanceof ImageResource) return src;
    return new ImageResource(src);
  }

  #size: Size;
  get size() {
    return this.#size;
  }

  constructor(src: ImageResourceParam, viewport?: RectValue) {
    let size: Size;
    let init: (stack: AsyncDisposableStack) => Promise<ImageSource> | ImageSource;
    if (Array.isArray(src)) {
      size = Size.parseValue(src[0]);
      const source = src[1];
      if (typeof source === "function") {
        init = async () => {
          const [ctx, getImage] = prepareOffscreenContext(size);
          await source(ctx);
          return getImage();
        };
      } else if (typeof source === "string") {
        init = () => loadImage(source);
      }
    } else if (src instanceof ImageResource) {
      size = src.#size;
      init = async () => {
        await src.initialize();
        return src.source;
      };
    } else if (hasTypedField(src, "url", "string") && hasTypedField(src, "width", "number") && hasTypedField(src, "height", "number")) {
      size = Size.parseValue(src);
      init = () => loadImage(src.url);
    } else {
      size = new Size(src);
      init = () => src;
    }

    super(async (stack) => {
      const source = await init(stack);
      if (!source) throw new ImageNotLoadedError();
      const _viewport = viewport !== undefined ? Rect.parseValue(viewport) : new Rect(0, size);
      return { source, viewport: _viewport };
    });
    this.#size = size;
  }

  get source() {
    return this.initializer.value.source;
  }
  get viewport() {
    return this.initializer.value.viewport;
  }

  renderImage(ctx: CanvasDrawImage, ...params: SourceDestParams): void {
    const { source, dest } = parseSourceDestParams(this.viewport, params);
    ctx.drawImage(this.source, source.x, source.y, source.w, source.h, dest.x, dest.y, dest.w, dest.h);
  }
}

export class ImageNotLoadedError extends createErrorClass("ImageNotLoadedError") {}
