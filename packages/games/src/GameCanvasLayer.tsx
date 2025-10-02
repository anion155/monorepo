import { useEffect, useRef } from "react";

import { useGameContext } from "./Game";

export const GameCanvasLayer = () => {
  const game = useGameContext();
  const ctxRef = useRef<CanvasRenderingContext2D>(null);
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const { width, height } = ctx.canvas;
    return game.on("frame", () => {
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, width, height);
    });
  }, [game]);
  return (
    <canvas
      ref={(canvas) => {
        ctxRef.current = canvas?.getContext("2d") ?? null;
      }}
      style={{ width: "100%", height: "100%" }}
    />
  );
};
