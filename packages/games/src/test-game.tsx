import type { ForwardedRef } from "react";

import { Loop } from "@/atoms/loop";

import { CanvasLayer, CanvasRendererComponent } from "./canvas-layer";
import { EntitiesOrdered } from "./entities-ordered";
import { EntityContext, type EntityController, NoEntity, useEntity } from "./entity";
import { GameProvider, useGameContext } from "./game";

const FPS_RATE = 1000 / 60;

export const TestGame = () => {
  return (
    <GameProvider>
      <NoEntity>
        <GameLoop />
        <CanvasLayer />
      </NoEntity>
      <EntitiesOrdered>
        <GameMap />
      </EntitiesOrdered>
    </GameProvider>
  );
};

const GameLoop = () => {
  const game = useGameContext();
  return <Loop ticks={{ [FPS_RATE]: game.events.frame }} />;
};

const GameMap = ({ ref }: { ref?: ForwardedRef<EntityController> }) => {
  const entity = useEntity(ref);
  return (
    <EntityContext.Provider value={entity}>
      <CanvasRendererComponent.Provider
        render={(ctx, canvasSize) => {
          ctx.fillStyle = "red";
          ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);
        }}
      />
    </EntityContext.Provider>
  );
};
