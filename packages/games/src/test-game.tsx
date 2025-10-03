import type { ForwardedRef } from "react";

import { Loop } from "@/atoms/loop";

import { CanvasLayer } from "./canvas-layer";
import { CanvasRenderer, CanvasRendererComponent } from "./canvas-renderer";
import { cssColors } from "./css-colors";
import { EntitiesOrdered } from "./entities-ordered";
import { EntityContext, type EntityController, useEntity } from "./entity";
import { GameProvider, useGameContext } from "./game";
import * as styles from "./test-game.css";

export const TestGame = () => {
  return (
    <div className={styles.screen}>
      <div className={styles.container}>
        <GameProvider>
          <GameLoop />
          <CanvasLayer width="800" height="600" className={styles.canvas}>
            <CanvasRenderer />
          </CanvasLayer>
          <EntitiesOrdered>
            <GameMap />
          </EntitiesOrdered>
        </GameProvider>
      </div>
    </div>
  );
};

const FPS_RATE = 1000 / 60;
const GameLoop = () => {
  const game = useGameContext();
  return <Loop ticks={{ [FPS_RATE]: game.events.frame }} />;
};

const GameMap = ({ ref }: { ref?: ForwardedRef<EntityController> }) => {
  const entity = useEntity(ref);
  return (
    <EntityContext.Provider value={entity}>
      <CanvasRendererComponent
        render={(canvas, canvasSize) => {
          canvas.fillStyle = cssColors.grey;
          canvas.fillRect(0, 0, canvasSize.w, canvasSize.h);
          for (let x = 0; x < canvasSize.w / 20; x += 1) {
            for (let y = 0; y < canvasSize.h / 20; y += 1) {
              canvas.fillStyle = (x + y) % 2 === 0 ? cssColors.black : cssColors.red;
              canvas.fillRect(x * 20, y * 20, 20, 20);
            }
          }
        }}
      />
    </EntityContext.Provider>
  );
};
