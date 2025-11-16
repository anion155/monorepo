import type { Point } from "@anion155/shared/linear/point";
import { Rect } from "@anion155/shared/linear/rect";

import type { SourceDestParams } from "./image-resource";
import { ImageResource, parseSourceDestParams } from "./image-resource";
import { Resource } from "./resource";

export type ImageLayer = {
  image: ImageResource;
  offset: Point;
  group?: number;
};
export const combineLayers = (layers: ImageLayer[]) => {
  const combined: ImageLayer[] = [];
  for (let index = 0; index < layers.length; index += 1) {
    const current = layers[index];
    const prev = combined[combined.length - 1];
    if (current.group === prev.group) {
      const rect = new Rect(current.offset, current.image.source).expandBy([prev.offset, prev.image.source]);
      const image = new ImageResource([
        rect,
        async (ctx) => {
          await using prevImage = await prev.image.initialize();
          prevImage.renderImage(ctx, prev.offset.sub(rect));
          await using currentImage = await current.image.initialize();
          currentImage.renderImage(ctx, current.offset.sub(rect));
        },
      ]);
      combined[combined.length - 1] = { image, offset: rect.position };
    } else {
      combined.push(current);
    }
  }
  return combined;
};

export class LayeredImagesResource extends Resource<ImageLayer[]> {
  constructor(layers: ImageLayer[], combine = true) {
    super(async (stack) => {
      const _layers = combine ? combineLayers(layers) : layers;
      for (const layer of _layers) {
        stack.append(await layer.image.initialize());
      }
      return _layers;
    });
  }
  get layers() {
    return this.initializer.value;
  }

  renderImage(ctx: CanvasDrawImage, ...params: SourceDestParams) {
    for (const layer of this.layers) {
      if (!layer) continue;
      const { source, dest } = parseSourceDestParams(new Rect(layer.offset, layer.image.source), params);
      layer.image.renderImage(ctx, source, dest);
    }
  }
}
