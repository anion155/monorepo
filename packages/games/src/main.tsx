import "@anion155/proposal-explicit-resource-management/global";

import { StrictMode } from "react";
import { AppRegistry } from "react-native";
import { View } from "react-native-web";

import { TestGame } from "./test-game";

const RNWrapper = () => (
  <StrictMode>
    <View style={{ width: "100%", height: "100%" }}>
      <TestGame />
    </View>
  </StrictMode>
);
AppRegistry.registerComponent("Game", () => RNWrapper);
AppRegistry.runApplication("Game", { rootTag: document.getElementById("app") });
