declare global {
  interface ImageAsset {
    readonly url: string;
    readonly type: "png" | (string & {});
    readonly width: number;
    readonly height: number;
  }
}

export {};
