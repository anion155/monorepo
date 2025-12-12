import "@anion155/shared/global";

import type { Point2DValue } from "@anion155/linear/point-2d";
import { Point2D } from "@anion155/linear/point-2d";
import { Rect } from "@anion155/linear/rect";
import type { SizeValue } from "@anion155/linear/size";
import { Size } from "@anion155/linear/size";

import type { ImageResourceParam } from "./image-resource";
import { ImageResource } from "./image-resource";
import { Resource } from "./resource";

export type SpritesResourceTiledConfig = { spriteSize: SizeValue; size?: SizeValue; offset?: Point2DValue; gaps?: SizeValue };
export type SpritesResourceParam = ExclusiveUnion<{ bounds: Rect[] }, SpritesResourceTiledConfig> & {
  src: ImageResourceParam;
};
export const parseSpritesBounds = (config: SpritesResourceParam, imageSize: SizeValue) => {
  const _imageSize = Size.parseValue(imageSize);
  let bounds: Rect[];
  if (config.bounds) {
    bounds = config.bounds;
  } else {
    const spriteSize = Size.parseValue(config.spriteSize);
    const size = Size.parseValue(config.size ?? Size.project(_imageSize, spriteSize)((image, sprite) => Math.trunc(image / sprite)));
    const offset = Point2D.parseValue(config.offset ?? 0);
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
  constructor(config: SpritesResourceParam) {
    super(async (stack) => {
      const image = ImageResource.parse(config.src);
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

  renderSprite(ctx: CanvasDrawImage, index: number, dest?: Point2D | Rect) {
    const srect = this.bounds[index];
    this.image.renderImage(ctx, srect, dest instanceof Rect ? dest : new Rect(0, srect));
  }

  readonly asImageResources = new Map.withFabric((index: number) => {
    return new ImageResource(this.image, this.bounds[index]);
  });
}
