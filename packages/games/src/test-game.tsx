import "@anion155/shared/global";
import "@anion155/shared/react/use-action";

import { Action } from "@anion155/shared/action";
import { Size } from "@anion155/shared/linear/size";
import { useActionAwait } from "@anion155/shared/react/use-action";
import * as Keys from "keycode-js";
import { Suspense, useEffect, useRef } from "react";

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
import * as styles from "./test-game.css";
import { TMXResource } from "./tmx-resource";

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
  return <Loop ticks={{ [FPS_RATE]: game.events.frame }} onLoop={game.events.tick} />;
};

type SpinnerEntityComponents = {
  canvasRenderer: CanvasRendererEntityComponent;
};
const Spinner = (props: EntityProps<SpinnerEntityComponents>) => {
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

const MapResource = new Action(() => new TMXResource.fromFile(GrassMapPath));
const Map = (props: EntityProps) => {
  const game = useGameContext();
  const camera = game.getEntity<CameraEntityComponents>("camera")?.components.position;
  const map = useActionAwait(MapResource);
  return (
    <Entity {...props}>
      <CanvasRendererEntityComponent.Register
        render={(canvas, canvasSize) => {
          canvas.fillStyle = cssColors.black;
          canvas.fillRect(0, 0, canvasSize.w, canvasSize.h);
          canvas.save();
          canvas.translate(canvasSize.w / 2, canvasSize.h / 2);
          if (camera) canvas.translate(-camera.value.x, -camera.value.y);
          map.renderMap(canvas, new Size(32, 32));
          canvas.restore();
        }}
      />
    </Entity>
  );
};

type CameraEntityComponents = {
  position: PositionEntityComponent;
};
const Camera = (props: EntityProps<CameraEntityComponents>) => {
  const ref = useRef<PositionEntityComponent>(null);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const position = ref.current;
      if (!position) return;
      switch (event.code) {
        case Keys.CODE_A:
          position.value = position.value.add([-10, 0]);
          break;
        case Keys.CODE_D:
          position.value = position.value.add([10, 0]);
          break;
        case Keys.CODE_S:
          position.value = position.value.add([0, 10]);
          break;
        case Keys.CODE_W:
          position.value = position.value.add([0, -10]);
          break;
      }
    };
    document.addEventListener("keypress", handler);
    return () => document.removeEventListener("keypress", handler);
  }, []);
  return (
    <Entity {...props}>
      <PositionEntityComponent.Register ref={ref} />
    </Entity>
  );
};

const Test = (props: EntityProps) => {
  return <Entity {...props}></Entity>;
};
