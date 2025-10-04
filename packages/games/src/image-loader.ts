import { Action } from "@anion155/shared/action";

export class ImageLoader extends Action<[src: string], HTMLImageElement> {
  static default = new ImageLoader();
  constructor() {
    super(async (src: string) => {
      const image = new Image();
      await new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.src = src;
      });
      return image;
    });
  }
}
