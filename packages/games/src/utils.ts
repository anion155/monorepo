import type { SizeValue } from "@anion155/linear/size";
import { Size } from "@anion155/linear/size";
import { DeveloperError } from "@anion155/shared";

export const loadImage = async (src: string) => {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (event) => reject(typeof event === "string" ? new Error(event) : new Error());
    image.src = src;
  });
  return image;
};

export const prepareOffscreenContext = (size: SizeValue) => {
  const _size = Size.parseValue(size);
  const canvas = new OffscreenCanvas(_size.w, _size.h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new DeveloperError("Failed to create OffscreenCanvas 2D context");
  return [ctx, () => createImageBitmap(canvas)] as const;
};

export const loadJSON = async <Result>(path: string): Promise<Result> => {
  const response = await fetch(path);
  const json: unknown = await response.json();
  return json as never;
};
