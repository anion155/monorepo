import { useDeepMemo, useStableCallback } from "@anion155/shared/react";
import type { Scheduler } from "@anion155/shared/scheduler";
import { rafScheduler } from "@anion155/shared/scheduler";
import { useEffect } from "react";

type LoopProps<SchedulerId> = {
  active?: boolean;
  ticks?: Record<number, (deltaTime: DOMHighResTimeStamp) => void>;
  onLoop?: (now: DOMHighResTimeStamp) => void;
  scheduler?: Scheduler<SchedulerId>;
};

export const Loop = <SchedulerId,>({ active = true, ticks = {}, onLoop, scheduler = rafScheduler as never }: LoopProps<SchedulerId>) => {
  const ticksMemoized = useDeepMemo(ticks);
  const onLoopStable = useStableCallback(onLoop);
  useEffect(() => {
    if (!active) return;
    let running = true;
    let scheduleId: SchedulerId;
    const config = Object.entries(ticksMemoized).map(([tickSize, handler]) => [Number(tickSize), handler] as const);
    const lastTick: Record<number, DOMHighResTimeStamp> = {};
    const loop = () => {
      if (!running) return;
      const now = performance.now();
      onLoopStable(now);
      for (const [tickSize, handler] of config) {
        const deltaTime = now - (lastTick[tickSize] ?? 0);
        if (deltaTime >= tickSize) {
          handler(deltaTime);
          lastTick[tickSize] = now;
        }
      }
      scheduleId = scheduler.schedule(loop);
    };
    loop();
    return () => {
      scheduler.cancel(scheduleId);
      running = false;
    };
  }, [active, onLoopStable, scheduler, ticksMemoized]);
  return null;
};
