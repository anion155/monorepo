import { Point } from "@anion155/shared/linear/point";
import type { RectValue } from "@anion155/shared/linear/rect";
import { Rect } from "@anion155/shared/linear/rect";
import type { Size } from "@anion155/shared/linear/size";

export const loadImage = async (src: string) => {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (event) => reject(typeof event === "string" ? new Error(event) : new Error());
    image.src = src;
  });
  return image;
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

  renderImage(ctx: CanvasDrawImage, dest: Point | Rect): void;
  renderImage(ctx: CanvasDrawImage, source: Rect, dest: Point): void;
  renderImage(ctx: CanvasDrawImage, source: Point, dest: Rect): void;
  renderImage(ctx: CanvasDrawImage, source: Rect, dest: Rect): void;
  renderImage(ctx: CanvasDrawImage, source: Point, dest: Point, size: Size): void;
  renderImage(
    ctx: CanvasDrawImage,
    ...params:
      | [dest: Point | Rect]
      | [source: Rect, dest: Point]
      | [source: Point, dest: Rect]
      | [source: Rect, dest: Rect]
      | [source: Point, dest: Point, size: Size]
  ): void {
    const { rect } = this;
    if (params.length === 3) {
      const [source, dest, size] = params;
      ctx.drawImage(this.image, rect.x + source.x, rect.y + source.y, size.w, size.h, dest.x, dest.y, size.w, size.h);
    } else if (params.length === 2) {
      const [source, dest] = params;
      let sourceSize: Size | undefined;
      let destSize: Size | undefined;
      if (source instanceof Rect) sourceSize = source.size;
      else sourceSize = (dest as Rect).size;
      if (dest instanceof Rect) destSize = dest.size;
      else destSize = (source as Rect).size;
      ctx.drawImage(this.image, rect.x + source.x, rect.y + source.y, sourceSize.w, sourceSize.h, dest.x, dest.y, destSize.w, destSize.h);
    } else if (params[0] instanceof Rect) {
      const [dest] = params;
      ctx.drawImage(this.image, rect.x, rect.y, rect.w, rect.h, dest.x, dest.y, dest.w, dest.h);
    } else {
      const [dest] = params;
      ctx.drawImage(this.image, rect.x, rect.y, rect.w, rect.h, dest.x, dest.y, rect.w, rect.h);
    }
  }
}
