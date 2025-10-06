import "@anion155/shared/global";
import "@anion155/shared/react/use-action";

import { Action } from "@anion155/shared/action";
import { Point, Size } from "@anion155/shared/vectors";
import { Suspense, useRef } from "react";

import GrassMapPath from "@/assets/grass_tileset_map.tmj?url";
import { Loop } from "@/atoms/loop";

import { CanvasLayer } from "./canvas-layer";
import { CanvasRenderer, CanvasRendererEntityComponent } from "./canvas-renderer";
import { cssColors } from "./css-colors";
import { EntitiesOrdered } from "./entities-ordered";
import type { EntityProps } from "./entity";
import { Entity } from "./entity";
import { GameProvider, useGameContext } from "./game";
import { PositionEntityComponent } from "./position";
import { ResourceEntityComponent } from "./resources";
import * as styles from "./test-game.css";
import { createTMXResource, type TMXResource } from "./tmx-resource";

export const TestGame = () => {
  return (
    <div className={styles.screen}>
      <div className={styles.container}>
        <GameProvider>
          <GameLoop />
          <CanvasLayer width="800" height="600" className={styles.canvas}>
            <CanvasRenderer />
          </CanvasLayer>
          <Camera name="camera" />
          <Suspense fallback={<Spinner name="spinner" />}>
            <EntitiesOrdered>
              <Map name="map" />
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
  return <Loop ticks={{ [FPS_RATE]: game.events.frame }} />;
};

const Spinner = (props: EntityProps) => {
  return (
    <Entity {...props}>
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
const Map = (props: EntityProps) => {
  const MapRef = useRef<TMXResource | null>(null);
  return (
    <Entity {...props}>
      <MapResource ref={MapRef} />
      <CanvasRendererEntityComponent.Register
        render={(canvas, canvasSize) => {
          canvas.fillStyle = cssColors.black;
          canvas.fillRect(0, 0, canvasSize.w, canvasSize.h);
          canvas.save();
          MapRef.current?.render(canvas, new Size(32, 32));
          canvas.restore();
        }}
      />
    </Entity>
  );
};

const Camera = (props: EntityProps) => {
  return (
    <Entity {...props}>
      <PositionEntityComponent.Register position={new Point(0, 0)} />
    </Entity>
  );
};

const Test = (props: EntityProps) => {
  return <Entity {...props}></Entity>;
};
