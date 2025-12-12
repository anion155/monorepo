import { type Point2D, Rect } from "@anion155/linear";

import type { Point2DBindingArgument, SizeBindingArgument } from "./binding";
import { Point2DComponent, SizeComponent } from "./binding";
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
  sprites: SpritesResourceParam | SpritesResource;
  animationConfig: MovingAnimationConfig;
  positionScale: SizeBindingArgument;
};
export class PlayerRenderer extends CanvasRendererEntityComponent {
  get #entity() {
    return this.entity as Player;
  }
  #sprites: SpritesResource;
  #animation: MovingAnimation;
  readonly positionScale: SizeComponent;

  positionOnMap() {
    return this.#entity.position.value.mul(this.positionScale.value);
  }

  constructor({ sprites, animationConfig, positionScale, ...params }: PlayerRendererParams) {
    super({
      ...params,
      initialize: async (stack) => {
        stack.append(await this.#sprites.initialize());
      },
    });
    this.#sprites = sprites instanceof SpritesResource ? sprites : new SpritesResource(sprites);
    this.#animation = new MovingAnimation(animationConfig);
    this.positionScale = new SizeComponent({ entity: params.entity, initial: positionScale });
  }

  render({ ctx }: CanvasRendererContext): void {
    ctx.translate(...this.positionOnMap().asTuple());
    const index = this.#animation.interpolate(this.#entity.state);
    const size = this.#entity.size.value ?? this.#sprites.bounds[index].size;
    this.#sprites.renderSprite(ctx, index, new Rect([-size.w / 2, 0], size));
  }
}

// declare global {
//   interface CollisionsMap {
//     player: { player: Player; collision: Rect };
//   }
// }
// export type PlayerCollisionParams = EntityComponentParams & {
//   bounds: RectValue;
// };
// export class PlayerCollision extends CollisionEntityComponent {
//   get #entity() {
//     return this.entity as Player;
//   }
//   readonly bounds: Rect;

//   constructor({ bounds, ...params }: PlayerCollisionParams) {
//     super(params);
//     this.bounds = Rect.parseValue(bounds);
//   }

//   *colisions() {
//     yield this.bounds;
//   }
//   *collide(targetRect: Rect): CollisionResults {
//     const collision = this.bounds.collide(targetRect);
//     if (collision) yield { type: "player", player: this.#entity, collision };
//   }
// }

export type PlayerParams = EntityParams &
  Omit<PlayerRendererParams, keyof EntityComponentParams> & {
    position: Point2DBindingArgument;
    size?: SizeBindingArgument<null>;
  };
export class Player extends Entity {
  readonly renderer: PlayerRenderer;
  readonly position: Point2DComponent;
  readonly size: SizeComponent<null>;
  readonly movingControlls: MovingControlls;

  constructor({ position, positionScale, sprites, size, animationConfig, ...entityParams }: PlayerParams) {
    super(entityParams, (stack) => {
      stack.append(
        LoopEntityComponent.getGameLoop(this).on("tick", (deltaTime) => {
          this.makeStep(this.movingControlls.current, deltaTime);
        }),
      );
    });
    this.renderer = new PlayerRenderer({ entity: this, name: "renderer", sprites, positionScale, animationConfig });
    this.position = new Point2DComponent({ entity: this, name: "position", initial: position });
    this.size = new SizeComponent({ entity: this, name: "size", initial: size });
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
    const current = this.position.value;
    let next: Point2D;
    if (directions[0] === "towards") next = current.add([0, deltaPos]);
    else if (directions[0] === "away") next = current.add([0, -deltaPos]);
    else if (directions[0] === "left") next = current.add([-deltaPos, 0]);
    else if (directions[0] === "right") next = current.add([deltaPos, 0]);
    else return;
    if (current.equals(next)) return;
    // new Rect([-size.w / 2, 0], size)
    // const collisions = CollisionEntityComponent.collide(this, new Rect())
    // const game = Game.getGame(entity);
    // for (const component of game.eachComponents(CollisionEntityComponent)) {
    //   yield* component.collide(rect);
    // }
    // this.position.set(next);
  }
}
