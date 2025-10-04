import "@anion155/shared/global";
import "@anion155/shared/react/use-action";

import { Action } from "@anion155/shared/action";
import { Point, Rect, Size } from "@anion155/shared/vectors";
import { type ForwardedRef, Suspense, useRef } from "react";

import BasicTilesPath from "@/assets/basic-tiles.png";
import { Loop } from "@/atoms/loop";

import { CanvasLayer } from "./canvas-layer";
import { CanvasRenderer, CanvasRendererEntityComponent } from "./canvas-renderer";
import { cssColors } from "./css-colors";
import { EntitiesOrdered } from "./entities-ordered";
import { Entity, type EntityController } from "./entity";
import { GameProvider, useGameContext } from "./game";
import type { SpritesResource } from "./image-resource";
import { createImageResource, createSpritesResource, loadImage } from "./image-resource";
import { ResourceEntityComponent } from "./resources";
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

const BasicTilesResource = ResourceEntityComponent.createResource(
  new Action(async () => {
    const image = await loadImage(BasicTilesPath);
    const imageResource = createImageResource(image);
    return createSpritesResource(imageResource, new Size(8, 15), { spriteSize: new Size(16, 16) });
  }).useAwait,
);
const GameMap = ({ ref }: { ref?: ForwardedRef<EntityController> }) => {
  const BasicTilesRef = useRef<SpritesResource | null>(null);
  return (
    <Entity ref={ref} name="map">
      <BasicTilesResource ref={BasicTilesRef} />
      <CanvasRendererEntityComponent.Register
        render={(canvas, canvasSize) => {
          canvas.fillStyle = cssColors.black;
          canvas.fillRect(0, 0, canvasSize.w, canvasSize.h);
          for (let x = 0; x < canvasSize.w / 20; x += 1) {
            for (let y = 0; y < canvasSize.h / 20; y += 1) {
              BasicTilesRef.current?.renderSprite(canvas, new Point(0, 8), new Rect(x * 20, y * 20, 20, 20));
            }
          }
        }}
      />
    </Entity>
  );
};

const Test = ({ ref }: { ref?: ForwardedRef<EntityController> }) => {
  return <Entity ref={ref} name="test"></Entity>;
};
