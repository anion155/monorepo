import "@anion155/proposal-explicit-resource-management/global";

import { AppRegistry } from "react-native";

import { App } from "./App";

AppRegistry.registerComponent("App", () => App);
AppRegistry.runApplication("App", { rootTag: document.getElementById("app") });
