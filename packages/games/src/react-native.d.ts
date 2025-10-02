declare module "react-native" {
  import RNW from "react-native-web";
  export const AppRegistry: RNW.AppRegistry;
  export const View: RNW.View;
  export const unstable_createElement: RNW.unstable_createElement;
  export default RNW;
}
