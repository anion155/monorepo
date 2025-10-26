import "@anion155/shared/global";

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

  renderSprite(ctx: CanvasDrawImage, index: number, dest?: Point | Rect) {
    const [sx, sy, sw, sh] = this.bounds[index];
    const [dx, dy] = dest instanceof Rect ? dest.position : [0, 0];
    const [dw, dh] = dest instanceof Rect ? dest.size : [sw, sh];
    ctx.drawImage(this.image, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  readonly asImageResources = new Map.withFabric((index: number) => {
    return new ImageResource(this.image, this.bounds[index]);
  });
}

// export class SpritesAnimation<Variants extends string> {
//   constructor(readonly sprites: SpritesResource, config: Record<Variants, >) {}

//   render(canvas: CanvasDrawImage, deltaTime: DOMHighResTimeStamp, variant: , dest: Point | Rect) {

//     this.sprites.renderSprite(canvas, index, dest);
//   }
// }
