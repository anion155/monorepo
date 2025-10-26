declare module "*.png" {
  const publicPath: string;
  export default publicPath;
}

declare module "*?url" {
  const publicPath: string;
  export default publicPath;
}
