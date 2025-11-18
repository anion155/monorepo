import { Point } from "@anion155/shared/linear/point";
import { Rect } from "@anion155/shared/linear/rect";
import type { SizeValue } from "@anion155/shared/linear/size";
import { Size } from "@anion155/shared/linear/size";
import { SignalBinding } from "@anion155/signals";

import type { PointComponentArg, SizeComponentArg } from "./binding";
import { PointComponent, SizeComponent } from "./binding";
import type { CanvasRendererContext } from "./canvas";
import { CanvasRendererEntityComponent } from "./canvas";
import type { EntityComponentParams, EntityParams } from "./entity";
import { Entity } from "./entity";
import { LoopEntityComponent } from "./loop";
import type { MovingAnimationConfig, MovingDirection, MovingSpeed, MovingState } from "./moving";
import { MovingAnimation, MovingControlls } from "./moving";
import type { SpritesResourceParam } from "./sprites-resource";
import { SpritesResource } from "./sprites-resource";

export type PlayerRendererParams = OmitHelper<EntityComponentParams, "entity"> & {
  entity: Player;
  positionScale: SizeValue;
  sprites: SpritesResourceParam | SpritesResource;
  animationConfig: MovingAnimationConfig;
};
export class PlayerRenderer extends CanvasRendererEntityComponent {
  get #entity() {
    return this.entity as Player;
  }
  readonly positionScale: SignalBinding<Size>;
  #sprites: SpritesResource;
  #animation: MovingAnimation;
  #animationConfig: MovingAnimationConfig;

  constructor({ positionScale, sprites, animationConfig, ...params }: PlayerRendererParams) {
    super(params);
    this.positionScale = new SignalBinding(Size.parseValue(positionScale));
    this.#sprites = sprites instanceof SpritesResource ? sprites : new SpritesResource(sprites);
    this.#animation = new MovingAnimation();
    this.#animationConfig = animationConfig;
  }

  render({ ctx }: CanvasRendererContext): void {
    const { position, spriteScale, state } = this.#entity;
    ctx.translate(...Point.mul(position.value, this.positionScale.value)._);
    const index = this.#animation.interpolate(this.#animationConfig, state);
    const size = Size.mul(this.#sprites.bounds[index].size, spriteScale.value);
    this.#sprites.renderSprite(ctx, index, new Rect([-size.w / 2, 0], size));
  }
}

export type PlayerParams = EntityParams &
  Omit<PlayerRendererParams, keyof EntityComponentParams> & {
    position: PointComponentArg;
    spriteScale?: SizeComponentArg;
  };
export class Player extends Entity {
  readonly renderer: PlayerRenderer;
  readonly position: PointComponent;
  readonly spriteScale: SizeComponent;
  readonly movingControlls: MovingControlls;

  constructor({ position, positionScale, sprites, spriteScale, animationConfig, ...entityParams }: PlayerParams) {
    super(entityParams, (stack) => {
      stack.append(
        LoopEntityComponent.getGameLoop(this).on("tick", (deltaTime) => {
          this.makeStep(this.movingControlls.current, deltaTime);
        }),
      );
    });
    this.renderer = new PlayerRenderer({ positionScale, sprites, animationConfig, entity: this, name: "renderer" });
    this.position = new PointComponent(position, { entity: this, name: "position" });
    this.spriteScale = new SizeComponent(spriteScale ?? 1, { entity: this, name: "size" });
    this.movingControlls = new MovingControlls({ entity: this, name: "movingControlls" });
  }

  #state: MovingState = { direction: "towards", moving: false };
  get state() {
    return this.#state;
  }
  makeStep({ directions, speed }: { directions: MovingDirection[]; speed: MovingSpeed }, deltaTime: DOMHighResTimeStamp) {
    if (!directions.length) {
      this.#state.moving = false;
      return;
    }
    const deltaPos = (deltaTime / 1000) * (speed === "run" ? 6 : 3);
    this.#state = { direction: directions[0], moving: speed };
    if (directions[0] === "towards") this.position.update((pos) => pos.add([0, deltaPos]));
    else if (directions[0] === "away") this.position.update((pos) => pos.add([0, -deltaPos]));
    else if (directions[0] === "left") this.position.update((pos) => pos.add([-deltaPos, 0]));
    else if (directions[0] === "right") this.position.update((pos) => pos.add([deltaPos, 0]));
  }
}
