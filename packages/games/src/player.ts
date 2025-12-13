import { type Point2D, Rect } from "@anion155/linear";
import { cached } from "@anion155/shared/decorators";
import { SignalReadonlyComputed } from "@anion155/signals";

import type { Point2DBindingArgument, RectBindingArgument, SizeBindingArgument } from "./binding";
import { Point2DComponent, RectComponent, SizeComponent } from "./binding";
import { boundsMul } from "./bounds";
import type { CanvasRendererContext } from "./canvas";
import { CanvasRendererEntityComponent } from "./canvas";
import type { CollisionResults } from "./collision";
import { CollisionEntityComponent } from "./collision";
import type { EntityComponentParams, EntityParams } from "./entity";
import { Entity } from "./entity";
import { LoopEntityComponent } from "./loop";
import type { MovingAnimationConfig, MovingDirection, MovingSpeed, MovingState } from "./moving";
import { MovingAnimation, MovingControlls } from "./moving";
import type { SpritesResourceParam } from "./sprites-resource";
import { SpritesResource } from "./sprites-resource";

export type PlayerRendererParams = OmitHelper<EntityComponentParams, "entity"> & {
  entity: Player;
  layer: string;
  sprites: SpritesResourceParam | SpritesResource;
  animationConfig: MovingAnimationConfig;
};
export class PlayerRenderer extends CanvasRendererEntityComponent {
  get #entity() {
    return this.entity as Player;
  }
  #sprites: SpritesResource;
  #animation: MovingAnimation;

  constructor({ sprites, animationConfig, ...params }: PlayerRendererParams) {
    super({
      ...params,
      initialize: async (stack) => {
        stack.append(await this.#sprites.initialize());
      },
    });
    this.#sprites = sprites instanceof SpritesResource ? sprites : new SpritesResource(sprites);
    this.#animation = new MovingAnimation(animationConfig);
  }

  render({ ctx }: CanvasRendererContext, layer: string): void {
    // if (DEBUG.get("objectDrawSpriteBounds")) drawDebugBounds(ctx, this.#entity.spriteBoundsOnMap.value, { color: cssColors.green });
    // if (DEBUG.get("objectDrawBounds")) drawDebugBounds(ctx, this.#entity.boundsOnMap.value, { color: cssColors.red });
    // if (DEBUG.get("characterDrawPosition")) drawDebugPosition(ctx, this.#entity.positionOnMap.value);
    const index = this.#animation.interpolate(this.#entity.state);
    this.#sprites.renderSprite(ctx, index, this.#entity.spriteBoundsOnMap.value);
  }
}
declare global {
  interface DebugFlags {
    objectDrawSpriteBounds: boolean;
    objectDrawBounds: boolean;
    characterDrawPosition: boolean;
  }
}

declare global {
  interface CollisionsMap {
    player: { player: Player; collision: Rect };
  }
}
export type PlayerCollisionParams = EntityComponentParams;
export class PlayerCollision extends CollisionEntityComponent {
  get #entity() {
    return this.entity as Player;
  }

  constructor({ ...params }: PlayerCollisionParams) {
    super(params);
  }

  *collide(targetRect: Rect): CollisionResults {
    const bounds = this.#entity.bounds.value;
    const collision = bounds.collide(targetRect);
    if (collision) yield { type: "player", player: this.#entity, collision };
  }
}

export type PlayerParams = EntityParams &
  Omit<PlayerRendererParams, keyof EntityComponentParams> &
  Omit<PlayerCollisionParams, keyof EntityComponentParams> & {
    position: Point2DBindingArgument;
    size: SizeBindingArgument;
    scale?: SizeBindingArgument<null>;
    bounds?: RectBindingArgument<null>;
  };
export class Player extends Entity {
  readonly position: Point2DComponent;
  readonly size: SizeComponent;
  readonly scale: SizeComponent;
  readonly boundsScale: RectComponent<null>;

  readonly renderer: PlayerRenderer;
  readonly movingControlls: MovingControlls;
  readonly collisions: PlayerCollision;

  @cached
  get positionOnMap() {
    return new SignalReadonlyComputed(() => this.position.value.mul(this.scale.value));
  }

  @cached
  get sizeOnMap() {
    return new SignalReadonlyComputed(() => this.size.value.mul(this.scale.value));
  }

  @cached
  get spriteBounds() {
    return new SignalReadonlyComputed(() => {
      const position = this.position.value;
      const size = this.size.value;
      return new Rect([position.x - size.w / 2, position.y - size.h], size);
    });
  }
  @cached
  get spriteBoundsOnMap() {
    return new SignalReadonlyComputed(() => boundsMul(this.spriteBounds.value, this.scale.value));
  }

  @cached
  get bounds() {
    return new SignalReadonlyComputed(() => {
      let bounds = this.spriteBounds.value;
      if (this.boundsScale.value) {
        const { x, y, w, h } = this.boundsScale.value;
        bounds = new Rect(bounds.x + bounds.w * x, bounds.y + bounds.h * y, bounds.w * w, bounds.h * h);
      }
      return bounds;
    });
  }
  @cached
  get boundsOnMap() {
    return new SignalReadonlyComputed(() => boundsMul(this.bounds.value, this.scale.value));
  }

  constructor({ position, size, scale, bounds, layer, sprites, animationConfig, ...entityParams }: PlayerParams) {
    super(entityParams, (stack) => {
      stack.append(
        LoopEntityComponent.getGameLoop(this).on("tick", (deltaTime) => {
          this.makeStep(this.movingControlls.current, deltaTime);
        }),
      );
    });
    this.position = new Point2DComponent({ entity: this, name: "position", initial: position });
    this.size = new SizeComponent({ entity: this, name: "size", initial: size });
    this.scale = new SizeComponent({ entity: this, name: "scale", initial: scale as never, default: 1 });
    this.boundsScale = new RectComponent({ entity: this, name: "bounds", initial: bounds });

    this.renderer = new PlayerRenderer({ entity: this, name: "renderer", layer, sprites, animationConfig });
    this.movingControlls = new MovingControlls({ entity: this, name: "movingControlls" });
    this.collisions = new PlayerCollision({ entity: this, name: "collisions" });
  }

  #state: MovingState = { direction: "towards", moving: false };
  get state() {
    return this.#state;
  }
  makeStep({ directions, speed }: { directions: MovingDirection[]; speed: MovingSpeed }, deltaTime: DOMHighResTimeStamp) {
    if (!directions.length) {
      this.#state.moving = false;
      return false;
    }
    const deltaPos = (deltaTime / 1000) * (speed === "run" ? 6 : 3);
    this.#state = { direction: directions[0], moving: speed };
    const current = this.position.value;
    let next: Point2D;
    if (directions[0] === "towards") next = current.add([0, deltaPos]);
    else if (directions[0] === "away") next = current.add([0, -deltaPos]);
    else if (directions[0] === "left") next = current.add([-deltaPos, 0]);
    else if (directions[0] === "right") next = current.add([deltaPos, 0]);
    else return false;
    if (current.equals(next)) return false;
    this.position.set(next);
    const collisions = CollisionEntityComponent.collide(this, this.bounds.value);
    if (!collisions.next().done) {
      this.position.set(current);
      return false;
    }
    return true;
  }
}
