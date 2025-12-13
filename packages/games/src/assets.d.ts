declare module "*.png" {
  const publicPath: string;
  export default publicPath;
}

declare module "*?url" {
  const publicPath: string;
  export default publicPath;
}

declare module "*?image" {
  const asset: ImageAsset;
  export default asset;
}

declare module "*?tmx" {
  import type { TMXMap } from "@/tmx-types";
  const map: TMXMap & { filePath: string };
  export default map;
}
