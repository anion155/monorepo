import "@anion155/proposal-explicit-resource-management/global";
import "@anion155/proposal-iterator-helpers/global";
import "./debug";

import { Size } from "@anion155/linear/size";
import { assert } from "@anion155/shared";
import { SignalState } from "@anion155/signals";

import CharactersAsset from "@/assets/characters.png?image";
import TestMapPath from "@/assets/test_map/test_map.tmj?url";

import { Camera } from "./camera";
import { CanvasRendererLayer } from "./canvas";
import { Game } from "./game";
import type { Loop } from "./loop";
import { LoopEntityComponent } from "./loop";
import { Player } from "./player";
import { TiledMap } from "./tiled-map";
import { UserInput } from "./user-input";

class TestGame extends Game {
  readonly loop: Loop<"frame">;
  readonly canvasRenderer: CanvasRendererLayer;
  readonly map: TiledMap;
  readonly player: Player;
  readonly camera: Camera;
  readonly userInput: UserInput;
  constructor(root: HTMLDivElement) {
    super({ name: "test" });
    this.loop = new LoopEntityComponent({ entity: this, name: "loop", config: { frame: 1000 / 60 } });

    const tileSize = new SignalState(new Size(32));

    this.canvasRenderer = new CanvasRendererLayer({ root, size: [800, 600], name: "renderer", parent: this });
    this.map = new TiledMap({ filePath: TestMapPath, name: "map", parent: this, tileSize: () => tileSize.value });
    this.camera = new Camera({ name: "camera", parent: this });
    this.canvasRenderer.offset.bind(() => this.camera.position.value);
    this.player = new Player({
      position: 16,
      scale: () => tileSize.value,
      sprites: { src: CharactersAsset, offset: [0, 16 * 4], spriteSize: 16, size: [3, 4] },
      size: 1,
      bounds: [0, 0.2, 1, 0.8],
      animationConfig: {
        towards: 1,
        away: 10,
        left: 4,
        right: 7,
        "towards-walk": [500, [1, 0, 1, 2]],
        "away-walk": [500, [10, 9, 10, 11]],
        "left-walk": [500, [4, 3, 4, 5]],
        "right-walk": [500, [7, 6, 7, 8]],
      },
      name: "player",
      parent: this,
    });
    this.camera.position.bind(() => this.player.positionOnMap.value);
    this.userInput = new UserInput({ name: "userInput", parent: this });
  }
}

async function main() {
  const appDiv = document.querySelector("#app");
  assert(appDiv);
  const rootDiv = document.createElement("div");
  appDiv.append(rootDiv);

  const game = new TestGame(rootDiv);
  Object.assign(globalThis, { game });
  await game.initialize();
}
await main().catch((error) => {
  console.error("Game crashed:", error);
});
