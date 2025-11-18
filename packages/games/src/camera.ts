import type { PointComponentArg } from "./binding";
import { PointComponent } from "./binding";
import type { EntityParams } from "./entity";
import { Entity } from "./entity";

export type CameraParams = EntityParams & {
  position?: PointComponentArg;
};
export class Camera extends Entity {
  readonly position: PointComponent;

  constructor({ position, ...entityParams }: CameraParams) {
    super(entityParams);
    this.position = new PointComponent(position ?? [0, 0], { entity: this, name: "position" });
  }
}
