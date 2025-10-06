import { EventEmitter } from "@anion155/shared/event-emitter";
import { useConst } from "@anion155/shared/react";
import { Point } from "@anion155/shared/vectors";
import { useEffect } from "react";

import { createEntityComponent, EntityController } from "./entity";

export class PositionController extends EventEmitter<{ change(value: Point): void }> {
  #value: Point = new Point(0, 0);
  #follow: { (): void } | undefined = undefined;
  get value(): Point {
    return this.#value;
  }
  set value(next: Point) {
    this.#follow?.();
    this.#follow = undefined;
    this.#value = next;
    this.emit("change", next);
  }

  follow(follow: EntityController | PositionController) {
    this.#follow?.();
    if (follow instanceof EntityController) follow = PositionEntityComponent.get(follow)!;
    const cleanup = follow.on("change", (next) => {
      this.#value = next;
      this.emit("change", next);
    });
    this.#follow = cleanup;
    return cleanup;
  }
}

declare module "./entity" {
  interface EntityComponents {
    position: PositionController;
  }
}

export const PositionEntityComponent = createEntityComponent(
  "position",
  ({ position, follow }: ExclusiveUnion<{ position?: Point }, { follow: EntityController | PositionController }>) => {
    const controller = useConst(() => new PositionController());
    useEffect(() => {
      if (position) controller.value = position;
      if (follow) controller.follow(follow);
    }, [controller, follow, position]);
    return controller;
  },
);
