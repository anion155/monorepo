import { DeveloperError } from "@anion155/shared";
import { EventEmitter } from "@anion155/shared/event-emitter";
import type { SchedulerCancelable } from "@anion155/shared/scheduler";
import { immidiateScheduler, rafScheduler } from "@anion155/shared/scheduler";
import { nanoid } from "nanoid/non-secure";

import type { Entity, EntityComponentParams, IEntityComponent } from "./entity";
import { Game } from "./game";

export class Loop<Ticks extends string, SchedulerId = number> extends EventEmitter<
  { tick(deltaTime: DOMHighResTimeStamp): void } & { [Tick in Ticks]: (deltaTime: DOMHighResTimeStamp) => void }
> {
  readonly config: [Ticks, number][];
  constructor(
    config: Record<Ticks, number>,
    readonly scheduler: SchedulerCancelable<SchedulerId> = rafScheduler as never,
  ) {
    super(immidiateScheduler);
    this.config = Object.entries({ ...config, tick: 1 }) as never;
  }

  #running: false | { id: SchedulerId; last: Record<Ticks | "tick", DOMHighResTimeStamp | undefined> } = false;
  start() {
    if (this.#running) return;
    const loop = () => {
      if (!this.#running) return;
      const now = performance.now();
      for (const [name, minDiff] of this.config) {
        const deltaTime = this.#running.last[name] !== undefined ? now - this.#running.last[name] : 0;
        if (this.#running.last[name] === undefined || deltaTime >= minDiff) {
          this.#running.last[name] = now;
          // @ts-expect-error - can't exclude tick from ticks here
          this.emit(name, deltaTime);
        }
      }
      schedule();
    };
    const schedule = () => {
      const id = this.scheduler.schedule(loop);
      const last = this.#running ? this.#running.last : ({} as never);
      this.#running = { id, last };
    };
    schedule();
    return () => this.stop();
  }
  stop() {
    if (!this.#running) return;
    this.scheduler.cancel(this.#running.id);
    this.#running = false;
  }
}

export type LoopEntityComponentParams<Ticks extends string> = EntityComponentParams & {
  config: Record<Ticks, number>;
};
export class LoopEntityComponent<Ticks extends string> extends Loop<Ticks> implements IEntityComponent {
  static getGameLoop(from: Entity) {
    const game = Game.getGame(from);
    const loop = game.findComponent(LoopEntityComponent);
    if (!loop) throw new DeveloperError("Failed to find game's loop");
    return loop;
  }

  readonly entity: Entity;
  readonly name: string;

  constructor({ entity, name = nanoid(), config }: LoopEntityComponentParams<Ticks>) {
    super(config, rafScheduler);
    this.entity = entity;
    this.name = name;
    entity.registerComponent(this);
  }
  initialize() {
    this.start();
  }
  [Symbol.dispose]() {
    this.stop();
  }
}
