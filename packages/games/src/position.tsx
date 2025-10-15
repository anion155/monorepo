import { EventEmitter } from "@anion155/shared/event-emitter";
import type { PointValue } from "@anion155/shared/linear/point";
import { Point } from "@anion155/shared/linear/point";
import { useFabric } from "@anion155/shared/react";
import { type ForwardedRef, useEffect } from "react";

import { EntityController, useRegisterEntityComponent } from "./entity";
import type { GameController } from "./game";

type PositionEntityComponentProps = { ref?: ForwardedRef<PositionEntityComponent>; name?: string } & ExclusiveUnion<
  { position?: PointValue },
  { follow: EntityController<{ position: PositionEntityComponent }> | PositionEntityComponent }
>;
const PositionEntityComponentRegister = ({ ref, position, follow, name }: PositionEntityComponentProps) => {
  const component = useFabric(() => new PositionEntityComponent((position ?? follow) as never, name), [follow, name, position]);
  useEffect(() => {
    if (position) component.value = Point.parseValue(position);
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
  set value(next: PointValue) {
    this.#follow?.();
    this.#follow = undefined;
    this.#value = Point.parseValue(next);
    this.emit("change", this.#value);
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

  useReact(
    position: string | PointValue | EntityController<{ position: PositionEntityComponent }> | PositionEntityComponent | undefined,
    entity: EntityController,
    game: GameController,
  ) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!position) return;
      let pos: PositionEntityComponent;
      if (typeof position === "string") {
        console.log("GG", [...game]);
        const followEntity = game.getEntity(position);
        if (!followEntity) return;
        if (!("position" in followEntity.components)) return;
        if (!(followEntity.components.position instanceof PositionEntityComponent)) return;
        pos = followEntity.components.position;
      } else if (position instanceof EntityController) {
        pos = position.components.position;
      } else if (position instanceof PositionEntityComponent) {
        pos = position;
      } else {
        this.value = position;
        return;
      }
      this.follow(pos);
    }, [game, position]);
  }

  static Register = PositionEntityComponentRegister;
}
