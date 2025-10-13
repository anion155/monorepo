import { EventEmitter } from "@anion155/shared/event-emitter";
import { Point } from "@anion155/shared/linear/point";
import { useFabric } from "@anion155/shared/react";
import { type ForwardedRef, useEffect } from "react";

import { EntityController, useRegisterEntityComponent } from "./entity";

type PositionEntityComponentProps = { ref?: ForwardedRef<PositionEntityComponent>; name?: string } & ExclusiveUnion<
  { position?: Point },
  { follow: EntityController<{ position: PositionEntityComponent }> | PositionEntityComponent }
>;
const PositionEntityComponentRegister = ({ ref, position, follow, name }: PositionEntityComponentProps) => {
  const component = useFabric(() => new PositionEntityComponent((position ?? follow) as never, name), [follow, name, position]);
  useEffect(() => {
    if (position) component.value = position;
    else if (follow) component.follow(follow);
  }, [component, follow, position]);
  useRegisterEntityComponent(component, ref);
  return null;
};

export class PositionEntityComponent extends EventEmitter<{ change(value: Point): void }> {
  #value: Point;
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
  follow(follow: PositionEntityComponent | EntityController<{ position: PositionEntityComponent }>) {
    this.#follow?.();
    if (follow instanceof EntityController) follow = follow.components.position;
    const cleanup = follow.on("change", (next) => {
      this.#value = next;
      this.emit("change", next);
    });
    this.#follow = cleanup;
    return cleanup;
  }

  constructor(position?: Point, name?: string);
  constructor(follow: PositionEntityComponent | EntityController<{ position: PositionEntityComponent }>, name?: string);
  constructor(
    positionOrFollow?: Point | PositionEntityComponent | EntityController<{ position: PositionEntityComponent }>,
    readonly name = "position",
  ) {
    super();
    if (positionOrFollow instanceof Point) {
      this.#value = positionOrFollow;
    } else if (positionOrFollow) {
      this.#value = new Point(0, 0);
      this.follow(positionOrFollow);
    } else {
      this.#value = new Point(0, 0);
    }
  }

  static Register = PositionEntityComponentRegister;
}
