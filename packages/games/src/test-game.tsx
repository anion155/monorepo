import "@anion155/shared/global";
import "@anion155/shared/react/use-action";

import { Action } from "@anion155/shared/action";
import { type ForwardedRef, Suspense, useRef } from "react";

import GrassMapPath from "@/assets/grass_tileset_map.tmj?url";
import { Loop } from "@/atoms/loop";

import { CanvasLayer } from "./canvas-layer";
import { CanvasRenderer, CanvasRendererEntityComponent } from "./canvas-renderer";
import { cssColors } from "./css-colors";
import { EntitiesOrdered } from "./entities-ordered";
import { Entity, type EntityController } from "./entity";
import { GameProvider, useGameContext } from "./game";
import { ResourceEntityComponent } from "./resources";
import * as styles from "./test-game.css";
import type { TMXResource } from "./tmx-resource";
import { createTMXResource } from "./tmx-resource";

export const TestGame = () => {
  return (
    <div className={styles.screen}>
      <div className={styles.container}>
        <GameProvider>
          <GameLoop />
          <CanvasLayer width="800" height="600" className={styles.canvas}>
            <CanvasRenderer />
          </CanvasLayer>
          <Suspense fallback={<Spinner />}>
            <EntitiesOrdered>
              <GameMap />
              <Test />
            </EntitiesOrdered>
          </Suspense>
        </GameProvider>
      </div>
    </div>
  );
};

const FPS_RATE = 1000 / 60;
const GameLoop = () => {
  const game = useGameContext();
  return <Loop ticks={{ [1000]: game.events.frame }} />;
};

const Spinner = ({ ref }: { ref?: ForwardedRef<EntityController> }) => {
  return (
    <Entity ref={ref} name="spinner">
      <CanvasRendererEntityComponent.Register
        render={(canvas, size) => {
          const lines = 16;
          const rotation = (Math.trunc(Date.now() / (1000 / lines)) % lines) / lines;
          canvas.translate(size.w / 2, size.h / 2);
          canvas.rotate(Math.PI * 2 * rotation);
          for (let index = 0; index < lines; index++) {
            canvas.beginPath();
            canvas.rotate((Math.PI * 2) / lines);
            canvas.moveTo(10, 0);
            canvas.lineTo(15, 0);
            canvas.lineWidth = 3;
            canvas.strokeStyle = `rgba(0, 0, 0, ${index / lines})`;
            canvas.stroke();
          }
        }}
      />
    </Entity>
  );
};

const MapResource = ResourceEntityComponent.createResource(new Action(() => createTMXResource(GrassMapPath)).useAwait);
const GameMap = ({ ref }: { ref?: ForwardedRef<EntityController> }) => {
  const MapRef = useRef<TMXResource | null>(null);
  return (
    <Entity ref={ref} name="map">
      <MapResource ref={MapRef} />
      <CanvasRendererEntityComponent.Register
        render={(canvas, canvasSize) => {
          canvas.fillStyle = cssColors.black;
          canvas.fillRect(0, 0, canvasSize.w, canvasSize.h);
          MapRef.current?.render(canvas);
        }}
      />
    </Entity>
  );
};

const Test = ({ ref }: { ref?: ForwardedRef<EntityController> }) => {
  return <Entity ref={ref} name="test"></Entity>;
};
