import "@anion155/proposal-explicit-resource-management/global";
import "@anion155/proposal-iterator-helpers/global";

import { assert, DeveloperError, isIterable, liftContext } from "@anion155/shared";
import { Initializer } from "@anion155/shared/actions/initializer";
import { bound } from "@anion155/shared/decorators";
import type { AnyEventsMap } from "@anion155/shared/event-emitter";
import { EventEmitter } from "@anion155/shared/event-emitter";
import type { PointValue } from "@anion155/shared/linear/point";
import { Point } from "@anion155/shared/linear/point";
import { Rect } from "@anion155/shared/linear/rect";
import type { SizeValue } from "@anion155/shared/linear/size";
import { Size } from "@anion155/shared/linear/size";
import { OrderedMap } from "@anion155/shared/ordered-map";
import type { SchedulerCancelable } from "@anion155/shared/scheduler";
import { immidiateScheduler, rafScheduler } from "@anion155/shared/scheduler";
import { SignalBinding, SignalReadonlyComputed, SignalState } from "@anion155/signals";
import { nanoid } from "nanoid/non-secure";

import CharactersPath from "@/assets/characters.png?url";
import TestMapPath from "@/assets/test_map/test_map.tmj?url";

import { Keys, type KeysCode } from "./keycodes";
import { loadImage } from "./load";
import { SpritesResource } from "./sprites-resource";
import { TMXResource } from "./tmx-resource";

class Resource<Events extends AnyEventsMap<never> = Record<never, unknown>> extends EventEmitter<
  Extend<Events, { initialized(stack: AsyncDisposableStack): void; disposed(): void }>
> {
  get #emitter() {
    return this as EventEmitter<{ initialized(stack: AsyncDisposableStack): void; disposed(): void }>;
  }

  constructor() {
    super(immidiateScheduler);
  }

  protected async _initialize(_stack: AsyncDisposableStack): Promise<void> {}
  readonly #initializer = new Initializer(
    liftContext(async ({ stack }) => {
      stack.append(() => this.#emitter.emit("disposed"));
      await this._initialize(stack);
      this.#emitter.emit("initialized", stack);
    }),
  );
  get initializer() {
    return this.#initializer;
  }
  async initialize() {
    await this.initializer.run();
    return this;
  }
  async dispose() {
    await this.initializer.dispose();
  }
  [Symbol.asyncDispose]() {
    return this.dispose();
  }
}

type EntityParams = { name?: string; parent?: IEntityHolder | null };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class Entity<Events extends AnyEventsMap<never> = any> extends Resource<Events> {
  readonly name: string;

  #parent!: IEntityHolder | null;
  get parent() {
    return this.#parent;
  }
  set parent(parent: IEntityHolder | null) {
    if (this.initializer.initialized) throw new DeveloperError("Already initialized");
    this.#parent?.children.delete(this.name);
    this.#parent = parent;
    parent?.children.push(this.name, this as never);
  }

  constructor({ name = nanoid(), parent = null }: EntityParams) {
    super();
    this.name = name;
    this.parent = parent;
    parent?.append(this);
  }

  #components = new Set<EntityComponent>();
  registerComponent(component: EntityComponent) {
    this.#components.add(component);
  }
  *eachComponents<T extends Constructable<never, unknown>>(type: T, name?: string) {
    for (const component of this.#components) {
      if (name && component.name !== name) continue;
      if (component instanceof type) yield component as InferConstructable<T>["Instance"];
    }
  }
  findComponent<T extends Constructable<never, unknown>>(type: T, name?: string) {
    for (const component of this.eachComponents(type, name)) {
      return component;
    }
    return undefined;
  }
}

type EntityComponent = {
  readonly entity: Entity;
  readonly name: string;
};
abstract class AutoEntityComponent<Events extends AnyEventsMap<never> = Record<never, unknown>> extends Resource<Events> {
  constructor(
    readonly entity: Entity,
    readonly name = nanoid(),
  ) {
    super();
    entity.registerComponent(this);
  }
}

interface IEntityHolder {
  readonly children: OrderedMap<string, Entity>;
  [Symbol.iterator](): Iterable<Entity>;
  each(): Iterable<Entity>;
  append(entity: Entity): this;
}
class EntityHolder<Events extends AnyEventsMap<never> = Record<never, unknown>> extends Entity<Events> implements IEntityHolder {
  readonly children = new OrderedMap<string, Entity>();

  protected async _initialize_child(child: Entity, stack: AsyncDisposableStack): Promise<void> {
    stack.append(await child.initialize());
  }
  protected async _initialize(stack: AsyncDisposableStack): Promise<void> {
    for (const child of this.children.values()) {
      await this._initialize_child(child, stack);
    }
  }

  *[Symbol.iterator]() {
    const queue: Entity[] = [...this.children.values()];
    while (queue.length > 0) {
      const entity = queue.shift()!;
      yield entity;
      if (isIterable(entity)) queue.push(...(entity as Iterable<Entity>));
    }
  }
  each(): Iterable<Entity> {
    return this[Symbol.iterator]();
  }
  append(entity: Entity): this {
    this.children.push(entity.name, entity);
    return this;
  }
}

class Loop<Ticks extends string, SchedulerId = number> extends EventEmitter<
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
class LoopEntityComponent<Ticks extends string> extends Loop<Ticks> implements EntityComponent {
  readonly entity: Entity;
  readonly name: string;
  constructor(config: Record<Ticks, number>, entity: Entity, name = nanoid()) {
    super(config, rafScheduler);
    this.entity = entity;
    entity.registerComponent(this);
    this.name = name;
  }
}

type CanvasRendererContext = {
  ctx: CanvasRenderingContext2D;
  size: Size;
  game: Game;
};
type CanvasRendererLayerParams = EntityParams & {
  root: HTMLDivElement;
  size: SizeValue;
  offset?: PointComponentArg;
};
class CanvasRendererLayer extends Entity {
  readonly root: HTMLDivElement;
  readonly size: Size;
  readonly offset: PointComponent;

  constructor({ root, size, offset, ...entityParams }: CanvasRendererLayerParams) {
    super(entityParams);
    this.root = root;
    this.size = Size.parseValue(size);
    this.offset = new PointComponent(offset ?? [0, 0], this, "offset");
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async _initialize(stack: AsyncDisposableStack) {
    const game = Game.getGame(this);

    const canvas = document.createElement("canvas");
    canvas.width = this.size.w;
    canvas.height = this.size.h;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.imageRendering = "crisp-edges";
    this.root.append(canvas);
    stack.append(() => canvas.remove());

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new DeveloperError("Failed to create canvas 2d context");
    ctx.imageSmoothingEnabled = false;
    const context: CanvasRendererContext = { ctx, game, size: this.size };

    const loop = game.findComponent(LoopEntityComponent);
    if (!loop) throw new DeveloperError("Failed to find game's loop");
    stack.append(loop.on("frame", (deltaTime) => this.render(context, deltaTime)));
  }

  render(context: CanvasRendererContext, deltaTime: DOMHighResTimeStamp) {
    const { ctx, game, size } = context;
    ctx.clearRect(0, 0, size.w, size.h);
    ctx.save();
    ctx.translate(...Point.project(size, this.offset.value, (size, position) => size / 2 - position)._);
    for (const entity of game) {
      for (const component of entity.eachComponents(CanvasRendererEntityComponent)) {
        ctx.save();
        component.render(context, deltaTime);
        ctx.restore();
      }
    }
    ctx.restore();
  }
}

abstract class CanvasRendererEntityComponent extends AutoEntityComponent {
  abstract render(context: CanvasRendererContext, deltaTime: DOMHighResTimeStamp): void;
}

type TiledMapParams = EntityParams & {
  filePath: string;
  tileSize?: SizeComponentArg;
};
class TiledMap extends Entity {
  readonly filePath: string;
  readonly tileSize: SizeComponent;

  constructor({ filePath, tileSize, ...entityParams }: TiledMapParams) {
    super(entityParams);
    this.filePath = filePath;
    this.tileSize = new SizeComponent(tileSize ?? 0, this, "tileSize");
  }

  #resource: TMXResource | null = null;
  get resource() {
    return this.#resource;
  }
  protected async _initialize(stack: AsyncDisposableStack): Promise<void> {
    this.#resource = await TMXResource.load(this.filePath);
    stack.append(() => (this.#resource = null));
  }

  readonly renderer = new (class TMXResourceRenderer extends CanvasRendererEntityComponent {
    get #entity(): TiledMap {
      return this.entity as TiledMap;
    }
    render({ ctx }: CanvasRendererContext, _deltaTime: DOMHighResTimeStamp): void {
      if (!this.#entity.resource) return;
      this.#entity.#resource?.renderMap(ctx, { tileSize: this.#entity.tileSize.value });
    }
  })(this, "renderer");
}

class BindingComponent<Value> extends SignalBinding<Value> implements EntityComponent {
  constructor(
    value: Value | { (): Value },
    readonly entity: Entity,
    readonly name: string = nanoid(),
  ) {
    super(value);
    entity.registerComponent(this);
  }
}
type PointComponentArg = PointValue | { (): PointValue };
class PointComponent extends BindingComponent<Point> {
  constructor(value: PointComponentArg, entity: Entity, name?: string) {
    super(typeof value === "function" ? () => Point.parseValue(value()) : Point.parseValue(value), entity, name);
  }
}
type SizeComponentArg = SizeValue | { (): SizeValue };
class SizeComponent extends BindingComponent<Size> {
  constructor(value: SizeComponentArg, entity: Entity, name?: string) {
    super(typeof value === "function" ? () => Size.parseValue(value()) : Size.parseValue(value), entity, name);
  }
}

type CameraParams = EntityParams & {
  position?: PointComponentArg;
};
class Camera extends Entity {
  readonly position: PointComponent;
  constructor({ position, ...entityParams }: CameraParams) {
    super(entityParams);
    this.position = new PointComponent(position ?? [0, 0], this, "position");
  }
}

type AnimationConfig = number | [duration: number, frames: number[]];
type AnimationsConfig<Names extends string> = { [Name in Names]: AnimationConfig };
type MovingAnimationConfig = AnimationsConfig<MovingDirection> & Partial<AnimationsConfig<`${MovingDirection}-${MovingSpeed | "stand"}`>>;
type MovingState = { direction: MovingDirection; moving: false | MovingSpeed };
class MovingAnimation {
  #last: (MovingState & { start: number }) | null = null;
  interpolate(config: MovingAnimationConfig, state: MovingState) {
    const now = performance.now();
    if (!this.#last || this.#last.direction !== state.direction || this.#last.moving !== state.moving) {
      this.#last = { ...state, start: now };
    }
    let animation: AnimationConfig = config[`${state.direction}-${state.moving || "stand"}`] ?? config[state.direction];
    if (!state.moving) {
      animation = config[`${state.direction}-stand`] ?? config[state.direction];
    } else if (state.moving === "walk") {
      animation = config[`${state.direction}-walk`] ?? config[state.direction];
    } else if (state.moving === "run") {
      animation = config[`${state.direction}-run`] ?? config[`${state.direction}-walk`] ?? config[state.direction];
    }
    let index: number;
    if (typeof animation === "number") {
      index = animation;
    } else {
      const duration = animation[0];
      const frame = Math.trunc((((now - this.#last.start) % duration) / duration) * animation[1].length);
      index = animation[1][frame];
    }
    return index;
  }
}

class PlayerRenderer extends CanvasRendererEntityComponent {
  get #entity() {
    return this.entity as Player;
  }

  constructor(
    readonly sprites: SpritesResource,
    entity: Entity,
    name?: string,
  ) {
    super(entity, name);
  }

  #animation = new MovingAnimation();
  render({ ctx }: CanvasRendererContext, _deltaTime: DOMHighResTimeStamp): void {
    const { position, positionScale, spriteScale, spriteConfig, state } = this.#entity;
    ctx.translate(...Point.mul(position.value, positionScale.value)._);
    const index = this.#animation.interpolate(spriteConfig, state);
    const size = Size.mul(this.sprites.bounds[index].size, spriteScale.value);
    this.sprites.renderSprite(ctx, index, new Rect([-size.w / 2, 0], size));
  }
}

type PlayerParams = EntityParams & {
  position: PointComponentArg;
  positionScale: SizeComponentArg;
  sprites: string | SpritesResource;
  spriteScale?: SizeComponentArg;
  spriteConfig: MovingAnimationConfig;
};
class Player extends Entity {
  readonly position: PointComponent;
  readonly positionScale: SizeComponent;
  readonly positionOnMap: SignalReadonlyComputed<Point>;
  readonly sprites: string | SpritesResource;
  readonly spriteScale: SizeComponent;
  readonly spriteConfig: MovingAnimationConfig;
  constructor({ position, positionScale, sprites, spriteScale, spriteConfig, ...entityParams }: PlayerParams) {
    super(entityParams);
    this.position = new PointComponent(position, this, "position");
    this.positionScale = new SizeComponent(positionScale ?? 1, this, "positionScale");
    this.positionOnMap = new SignalReadonlyComputed(() => {
      return this.position.value.mul(this.positionScale.value);
    });
    this.sprites = sprites;
    this.spriteScale = new SizeComponent(spriteScale ?? 1, this, "size");
    this.spriteConfig = spriteConfig;
  }

  renderer: PlayerRenderer | null = null;

  protected async _initialize(stack: AsyncDisposableStack) {
    let sprites: SpritesResource;
    if (typeof this.sprites === "string") {
      const image = await loadImage(CharactersPath);
      sprites = new SpritesResource(image, { spriteSize: new Size(16), size: new Size(3, 4) });
    } else {
      sprites = this.sprites;
    }
    this.renderer = new PlayerRenderer(sprites, this, "renderer");
    stack.append(() => (this.renderer = null));
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

class UserInput extends EventEmitter<{
  "keydown"(code: KeysCode, event: KeyboardEvent): void;
  "keydown_repeat"(code: KeysCode, event: KeyboardEvent): void;
  "keyup"(code: KeysCode, event: KeyboardEvent | FocusEvent): void;
  "change"(event: KeyboardEvent | FocusEvent): void;
}> {
  #pressed: KeysCode[] = [];

  readonly #initializer = new Initializer(
    liftContext(({ stack }) => {
      document.addEventListener("blur", this.onBlur);
      stack.append(() => document.removeEventListener("blur", this.onBlur));
      document.addEventListener("keydown", this.onKeyDown);
      stack.append(() => document.removeEventListener("keydown", this.onKeyDown));
      document.addEventListener("keyup", this.onKeyUp);
      stack.append(() => document.removeEventListener("keyup", this.onKeyUp));
    }),
  );
  get initializer() {
    return this.#initializer;
  }

  @bound
  protected onBlur(event: FocusEvent) {
    this.#pressed.forEach((code) => this.emit("keyup", code, event));
    this.emit("change", event);
    this.#pressed = [];
  }

  @bound
  protected onKeyDown(event: KeyboardEvent) {
    const code = event.code as KeysCode;
    if (event.repeat || this.#pressed.includes(code)) {
      this.emit("keydown_repeat", code, event);
      return;
    }
    this.#pressed.unshift(code);
    this.emit("keydown", code, event);
    this.emit("change", event);
  }

  @bound
  protected onKeyUp(event: KeyboardEvent) {
    const code = event.code as KeysCode;
    const index = this.#pressed.indexOf(code);
    if (index < 0) return;
    this.#pressed.splice(index, 1);
    this.emit("keyup", code, event);
    this.emit("change", event);
  }

  pressed(...codes: KeysCode[]): KeysCode[] {
    return codes.length === 0 ? this.#pressed.slice() : this.#pressed.filter((code) => codes.includes(code));
  }
}

type UserInputActionConfig<Actions extends string, Inputs extends string> = { [I in Inputs]?: Actions };

class UserInputAction<Actions extends string, Inputs extends string> {
  #held: Actions[] = [];
  get current(): Actions[] {
    if (this.defaultAction && !this.#held.length) return [this.defaultAction];
    return this.#held;
  }

  constructor(
    public config: UserInputActionConfig<Actions, Inputs>,
    readonly defaultAction: Actions | null = null,
  ) {}

  onInputDown(input: Inputs) {
    const action = this.config[input];
    if (!action) return;
    this.#held.unshift(action);
  }
  onInputUp(input: Inputs) {
    const action = this.config[input];
    if (!action) return;
    const index = this.#held.indexOf(action);
    if (index < 0) return;
    this.#held.splice(index, 1);
  }
}

type MovingDirection = "away" | "towards" | "left" | "right";
type MovingSpeed = "run" | "walk";
class MovingControlls {
  constructor(readonly userInput: UserInput) {}

  readonly directions = new UserInputAction<MovingDirection, KeysCode>({
    [Keys.CODE_S]: "towards",
    [Keys.CODE_DOWN]: "towards",
    [Keys.CODE_W]: "away",
    [Keys.CODE_UP]: "away",
    [Keys.CODE_A]: "left",
    [Keys.CODE_LEFT]: "left",
    [Keys.CODE_D]: "right",
    [Keys.CODE_RIGHT]: "right",
  });
  readonly speed = new UserInputAction<MovingSpeed, KeysCode>(
    {
      [Keys.CODE_SHIFT_LEFT]: "run",
      [Keys.CODE_SHIFT_RIGHT]: "run",
    },
    "walk",
  );
  readonly #actions = [this.directions, this.speed];

  get current() {
    return { directions: this.directions.current, speed: this.speed.current[0] };
  }

  readonly #initializer = new Initializer(
    liftContext(({ stack }) => {
      stack.append(this.userInput.on("keydown", this.onKeyboardDown));
      stack.append(this.userInput.on("keyup", this.onKeyboardUp));
    }),
  );
  get initializer() {
    return this.#initializer;
  }

  @bound
  protected onKeyboardDown(code: KeysCode) {
    this.#actions.forEach((action) => action.onInputDown(code));
  }

  @bound
  protected onKeyboardUp(code: KeysCode) {
    this.#actions.forEach((action) => action.onInputUp(code));
  }
}

type GameParams = OmitHelper<EntityParams, "parent">;
abstract class Game extends EntityHolder {
  static getGame(from: Entity) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let entity: Entity<any> = from;
    while (true) {
      const parent = entity.parent;
      if (parent === null) throw new DeveloperError("No Game parent found");
      if (parent instanceof Game) return parent;
      if (!(parent instanceof EntityHolder)) throw new DeveloperError("No Game parent found");
      entity = parent;
    }
  }
  constructor(entityParams: GameParams) {
    super({ ...entityParams, parent: null });
  }
}

class TestGame extends Game {
  readonly loop: Loop<"frame">;
  readonly canvasRenderer: CanvasRendererLayer;
  readonly map: TiledMap;
  readonly player: Player;
  readonly camera: Camera;
  readonly userInput: UserInput;
  readonly movingController: MovingControlls;
  constructor(root: HTMLDivElement) {
    super({ name: "test" });
    this.loop = new LoopEntityComponent({ frame: 1000 / 60 }, this, "loop");
    const tileSize = new SignalState(new Size(32));
    this.canvasRenderer = new CanvasRendererLayer({ root, size: [800, 600], name: "renderer", parent: this });
    this.map = new TiledMap({ filePath: TestMapPath, name: "map", parent: this, tileSize: () => tileSize.value });
    this.camera = new Camera({ name: "camera", parent: this });
    this.canvasRenderer.offset.bind(() => this.camera.position.value);
    this.player = new Player({
      position: 16,
      positionScale: () => tileSize.value,
      sprites: CharactersPath,
      spriteScale: 48 / 16,
      spriteConfig: {
        towards: 1,
        away: 10,
        left: 4,
        right: 7,
        "towards-walk": [500, [1, 0, 1, 2]],
        "away-walk": [500, [10, 9, 10, 11]],
        "left-walk": [500, [4, 3, 4, 5]],
        "right-walk": [500, [7, 6, 7, 8]],
      },
      name: "player",
      parent: this,
    });
    this.camera.position.bind(() => this.player.positionOnMap.value);
    this.userInput = new UserInput();
    this.movingController = new MovingControlls(this.userInput);
  }

  protected async _initialize(stack: AsyncDisposableStack): Promise<void> {
    await super._initialize(stack);
    stack.append(this.loop.start());

    // const path = new Size(2);
    // const startPos = this.player.position.value.sub(Size.div(path, 2));
    // const startTime = performance.now();
    // stack.append(
    //   this.loop.on("tick", () => {
    //     const overallProgress = ((performance.now() - startTime) % 4000) / 1000;
    //     const progress = overallProgress % 1;
    //     if (overallProgress < 1) {
    //       this.player.position.value = startPos.add([progress * path.w, 0]);
    //     } else if (overallProgress < 2) {
    //       this.player.position.value = startPos.add([path.w, progress * path.h]);
    //     } else if (overallProgress < 3) {
    //       this.player.position.value = startPos.add([path.w - progress * path.w, path.h]);
    //     } else if (overallProgress < 4) {
    //       this.player.position.value = startPos.add([0, path.h - progress * path.h]);
    //     }
    //   }),
    // );

    stack.append(await this.userInput.initializer.run());
    stack.append(await this.movingController.initializer.run());
    stack.append(this.loop.on("frame", (deltaTime) => this.player.makeStep(this.movingController.current, deltaTime)));
  }
}

async function main() {
  const appDiv = document.querySelector("#app");
  assert(appDiv);
  const rootDiv = document.createElement("div");
  appDiv.append(rootDiv);

  const game = new TestGame(rootDiv);
  Object.assign(globalThis, { game });
  await game.initialize();
}
await main().catch((error) => {
  console.error("Game crashed:", error);
});
