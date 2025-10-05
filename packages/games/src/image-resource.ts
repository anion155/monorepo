import { Point, Rect, Size } from "@anion155/shared/vectors";

export const loadImage = async (src: string) => {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (event) => reject(typeof event === "string" ? new Error(event) : new Error());
    image.src = src;
  });
  return image;
};

export const createImageResource = (image: HTMLImageElement) => {
  function render(canvas: CanvasDrawImage, dest: Point | Rect): void;
  function render(canvas: CanvasDrawImage, source: Rect, dest: Point): void;
  function render(canvas: CanvasDrawImage, source: Point, dest: Rect): void;
  function render(canvas: CanvasDrawImage, source: Rect, dest: Rect): void;
  function render(canvas: CanvasDrawImage, source: Point, dest: Point, size: Size): void;
  function render(
    canvas: CanvasDrawImage,
    ...params:
      | [dest: Point | Rect]
      | [source: Rect, dest: Point]
      | [source: Point, dest: Rect]
      | [source: Rect, dest: Rect]
      | [source: Point, dest: Point, size: Size]
  ): void {
    if (params.length === 3) {
      canvas.drawImage(image, params[0].x, params[0].y, params[2].w, params[2].h, params[1].x, params[1].y, params[2].w, params[2].h);
    } else if (params.length === 2) {
      const [source, dest] = params;
      let sourceSize: Size | undefined;
      let destSize: Size | undefined;
      if (source instanceof Rect) sourceSize = source.size;
      else sourceSize = (dest as Rect).size;
      if (dest instanceof Rect) destSize = dest.size;
      else destSize = (source as Rect).size;
      canvas.drawImage(image, source.x, source.y, sourceSize.w, sourceSize.h, dest.x, dest.y, destSize.w, destSize.h);
    } else if (params[0] instanceof Rect) {
      canvas.drawImage(image, params[0].x, params[0].y, params[0].w, params[0].h);
    } else {
      canvas.drawImage(image, params[0].x, params[0].y);
    }
  }
  return { image, render };
};
export type ImageResource = ReturnType<typeof createImageResource>;

export const createSpritesResource = (
  image: HTMLImageElement,
  maybeBounds: { spriteSize: Size; size?: Size; offset?: Point; gaps?: Size } | Rect[],
) => {
  let bounds: Rect[];
  if (Array.isArray(maybeBounds)) {
    bounds = maybeBounds;
  } else {
    const {
      spriteSize,
      size = new Size(Math.trunc(image.width / spriteSize.w), Math.trunc(image.height / spriteSize.h)),
      offset = new Point(0, 0),
      gaps = new Size(0, 0),
    } = maybeBounds;
    bounds = [];
    for (let y = 0; y < size.h; y += 1) {
      for (let x = 0; x < size.w; x += 1) {
        bounds.push(
          new Rect(offset.x + x * (spriteSize.w + gaps.w) - gaps.w, offset.y + y * (spriteSize.h + gaps.h) - gaps.h, spriteSize.w, spriteSize.h),
        );
      }
    }
  }

  function renderSprite(canvas: CanvasDrawImage, maybeIndex: number | Point, dest: Point | Rect) {
    const index = typeof maybeIndex === "number" ? maybeIndex : maybeIndex.y * cols + maybeIndex.x;
    const source = bounds[index];
    const destSize = dest instanceof Rect ? dest.size : source.size;
    canvas.drawImage(image, source.x, source.y, source.w, source.h, dest.x, dest.y, destSize.w, destSize.h);
  }
  return { ...createImageResource(image), renderSprite };
};
export type SpritesResource = ReturnType<typeof createSpritesResource>;
