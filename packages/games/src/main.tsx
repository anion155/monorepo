import "@anion155/proposal-explicit-resource-management/global";

import { AppRegistry } from "react-native";

import { Game } from "./Game";

AppRegistry.registerComponent("Game", () => Game);
AppRegistry.runApplication("Game", { rootTag: document.getElementById("game") });
