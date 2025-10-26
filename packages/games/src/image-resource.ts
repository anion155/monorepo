import { Point } from "@anion155/shared/linear/point";
import type { RectValue } from "@anion155/shared/linear/rect";
import { Rect } from "@anion155/shared/linear/rect";
import type { Size } from "@anion155/shared/linear/size";

export type SourceDestParams =
  | []
  | [dest: Point | Rect]
  | [source: Rect, dest: Point]
  | [source: Point, dest: Rect]
  | [source: Rect, dest: Rect]
  | [source: Point, dest: Point, size: Size];
export const parseSourceDestArg = (wholeSource: Rect, ...params: SourceDestParams): { source: Rect; dest: Rect } => {
  if (params.length === 3) {
    const [source, dest, size] = params;
    return { source: new Rect(wholeSource.x + source.x, wholeSource.y + source.y, size.w, size.h), dest: new Rect(dest.x, dest.y, size.w, size.h) };
  } else if (params.length === 2) {
    const [source, dest] = params;
    let sourceSize: Size | undefined;
    let destSize: Size | undefined;
    if (source instanceof Rect) sourceSize = source.size;
    else sourceSize = (dest as Rect).size;
    if (dest instanceof Rect) destSize = dest.size;
    else destSize = (source as Rect).size;
    return {
      source: new Rect(wholeSource.x + source.x, wholeSource.y + source.y, sourceSize.w, sourceSize.h),
      dest: new Rect(dest.x, dest.y, destSize.w, destSize.h),
    };
  } else if (params.length === 1) {
    if (params[0] instanceof Rect) {
      const [dest] = params;
      return { source: wholeSource, dest };
    }
    const [dest] = params;
    return { source: wholeSource, dest: new Rect(dest.x, dest.y, wholeSource.w, wholeSource.h) };
  } else {
    return { source: wholeSource, dest: new Rect(0, 0, wholeSource.w, wholeSource.h) };
  }
};

export class ImageResource {
  readonly rect: Rect;
  constructor(
    readonly image: Readonly<HTMLImageElement>,
    ...params: [] | [offset: Point] | [rect: RectValue]
  ) {
    if (!params.length) this.rect = new Rect([0, 0], image);
    else if (params[0] instanceof Point) this.rect = new Rect(params[0], image);
    else this.rect = Rect.parseValue(params[0]);
  }

  renderImage(ctx: CanvasDrawImage, ...params: SourceDestParams): void {
    const { source, dest } = parseSourceDestArg(this.rect, ...params);
    ctx.drawImage(this.image, source.x, source.y, source.w, source.h, dest.x, dest.y, dest.w, dest.h);
  }
}
