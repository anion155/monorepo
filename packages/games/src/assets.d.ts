declare module "*.png" {
  const publicPath: string;
  export default publicPath;
}

declare module "*.tmj?url" {
  const publicPath: string;
  export default publicPath;
}
