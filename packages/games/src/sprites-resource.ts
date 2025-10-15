import { Point } from "@anion155/shared/linear/point";
import { Rect } from "@anion155/shared/linear/rect";
import { Size } from "@anion155/shared/linear/size";

import { ImageResource } from "./image-resource";

export class SpritesResource extends ImageResource {
  readonly bounds: readonly Rect[];

  constructor(image: Readonly<HTMLImageElement>, maybeBounds: { spriteSize: Size; size?: Size; offset?: Point; gaps?: Size } | Rect[]) {
    super(image);
    if (Array.isArray(maybeBounds)) {
      this.bounds = maybeBounds;
    } else {
      const {
        spriteSize,
        size = new Size(Math.trunc(image.width / spriteSize.w), Math.trunc(image.height / spriteSize.h)),
        offset = new Point(0, 0),
        gaps = new Size(0, 0),
      } = maybeBounds;
      const bounds = [];
      for (let y = 0; y < size.h; y += 1) {
        for (let x = 0; x < size.w; x += 1) {
          bounds.push(
            new Rect(offset.x + x * (spriteSize.w + gaps.w) - gaps.w, offset.y + y * (spriteSize.h + gaps.h) - gaps.h, spriteSize.w, spriteSize.h),
          );
        }
      }
      this.bounds = bounds;
    }
  }

  renderSprite(canvas: CanvasDrawImage, index: number, dest: Point | Rect) {
    const source = this.bounds[index];
    const destSize = dest instanceof Rect ? dest.size : source.size;
    canvas.drawImage(this.image, source.x, source.y, source.w, source.h, dest.x, dest.y, destSize.w, destSize.h);
  }

  readonly asImageResources = new Map.withFabric((index: number) => {
    return new ImageResource(this.image, this.bounds[index]);
  });
}
