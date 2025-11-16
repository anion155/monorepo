import "@anion155/shared/global";

import type { PointValue } from "@anion155/shared/linear/point";
import { Point } from "@anion155/shared/linear/point";
import { Rect } from "@anion155/shared/linear/rect";
import type { SizeValue } from "@anion155/shared/linear/size";
import { Size } from "@anion155/shared/linear/size";

import type { ImageResourceParam } from "./image-resource";
import { ImageResource } from "./image-resource";
import { Resource } from "./resource";

export type SpritesResourceTiledConfig = { spriteSize: SizeValue; size?: SizeValue; offset?: PointValue; gaps?: SizeValue };
export type SpritesResourceParam = ExclusiveUnion<{ bounds: Rect[] }, SpritesResourceTiledConfig> | Rect[];
export const parseSpritesBounds = (config: SpritesResourceParam, imageSize: SizeValue) => {
  const _imageSize = Size.parseValue(imageSize);
  let bounds: Rect[];
  if (Array.isArray(config)) {
    bounds = config;
  } else if (config.bounds) {
    bounds = config.bounds;
  } else {
    const spriteSize = Size.parseValue(config.spriteSize);
    const size = Size.parseValue(config.size ?? Size.project(_imageSize, spriteSize, (image, sprite) => Math.trunc(image / sprite)));
    const offset = Point.parseValue(config.offset ?? 0);
    const gaps = Size.parseValue(config.gaps ?? 0);
    bounds = [];
    for (let y = 0; y < size.h; y += 1) {
      for (let x = 0; x < size.w; x += 1) {
        bounds.push(
          new Rect(offset.x + x * (spriteSize.w + gaps.w) - gaps.w, offset.y + y * (spriteSize.h + gaps.h) - gaps.h, spriteSize.w, spriteSize.h),
        );
      }
    }
  }
  return bounds;
};

export class SpritesResource extends Resource<{ readonly image: ImageResource; readonly bounds: readonly Rect[] }> {
  constructor(src: ImageResourceParam, config: SpritesResourceParam) {
    super(async (stack) => {
      const image = ImageResource.parse(src);
      stack.append(await image.initialize());
      const bounds = parseSpritesBounds(config, image.source);
      return { image, bounds };
    });
  }
  get image() {
    return this.initializer.value.image;
  }
  get bounds() {
    return this.initializer.value.bounds;
  }

  renderSprite(ctx: CanvasDrawImage, index: number, dest?: Point | Rect) {
    const srect = this.bounds[index];
    this.image.renderImage(ctx, srect, dest instanceof Rect ? dest : new Rect(0, srect));
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
