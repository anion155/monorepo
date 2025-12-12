import type { Point2DBindingArgument } from "./binding";
import { Point2DComponent } from "./binding";
import type { EntityParams } from "./entity";
import { Entity } from "./entity";

export type CameraParams = EntityParams & {
  position?: Point2DBindingArgument;
};
export class Camera extends Entity {
  readonly position: Point2DComponent;

  constructor({ position, ...entityParams }: CameraParams) {
    super(entityParams);
    this.position = new Point2DComponent({ entity: this, name: "position", initial: position ?? [0, 0] });
    this.registerComponent(this.position);
  }
}
