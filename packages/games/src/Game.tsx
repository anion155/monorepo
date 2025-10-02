import { useRef } from "react";

import { Loop } from "@/atoms/Loop";

const FPS_RATE = 1000 / 60;

export const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  return (
    <>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      <Loop
        ticks={{
          [FPS_RATE]: (delta) => {},
        }}
      />
    </>
  );
};
