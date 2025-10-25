import type { Point } from "@anion155/shared/linear/point";
import { Rect } from "@anion155/shared/linear/rect";

import type { SourceDestParams } from "./image-resource";
import { parseSourceDestArg } from "./image-resource";

export type ImageLayer = {
  image: HTMLImageElement;
  offset: Point;
};
export class LayeredImagesResource {
  constructor(readonly layers: Array<ImageLayer | null>) {}

  render(ctx: CanvasDrawImage & CanvasState & CanvasTransform, ...params: SourceDestParams) {
    for (const layer of this.layers) {
      if (!layer) continue;
      const { source, dest } = parseSourceDestArg(new Rect(layer.offset, layer.image), ...params);
      ctx.drawImage(layer.image, source.x, source.y, source.w, source.h, dest.x, dest.y, dest.w, dest.h);
    }
  }
}
