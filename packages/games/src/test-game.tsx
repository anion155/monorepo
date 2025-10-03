import "@anion155/shared/global";
import "@anion155/shared/react/use-action";

import { Action } from "@anion155/shared/action";
import { type ForwardedRef, Suspense } from "react";

import BasictilesPath from "@/assets/basictiles.png";
import { Loop } from "@/atoms/loop";

import { CanvasLayer } from "./canvas-layer";
import { CanvasRenderer, CanvasRendererComponent } from "./canvas-renderer";
import { cssColors } from "./css-colors";
import { EntitiesOrdered } from "./entities-ordered";
import { Entity, type EntityController } from "./entity";
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
  return <Loop ticks={{ [FPS_RATE]: game.events.frame }} />;
};

const Spinner = ({ ref }: { ref?: ForwardedRef<EntityController> }) => {
  return (
    <Entity ref={ref}>
      <CanvasRendererComponent
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

const GameMap = ({ ref }: { ref?: ForwardedRef<EntityController> }) => {
  return (
    <Entity ref={ref}>
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
    </Entity>
  );
};

const BasictilesAction = new Action(async (src: string) => {
  const image = new Image();
  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.src = src;
  });
  return image;
});
const Test = ({ ref }: { ref?: ForwardedRef<EntityController> }) => {
  const BasictilesImage = BasictilesAction.useAwait(BasictilesPath);
  return (
    <Entity ref={ref}>
      <CanvasRendererComponent
        render={(canvas, canvasSize) => {
          canvas.drawImage(BasictilesImage, 0, 0, 16, 16, 0, 0, 20, 20);
        }}
      />
    </Entity>
  );
};
