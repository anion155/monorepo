import "@anion155/proposal-explicit-resource-management/global";
import "@anion155/proposal-iterator-helpers/global";

import { assert, DeveloperError, isIterable, liftContext } from "@anion155/shared";
import { Initializer } from "@anion155/shared/actions/initializer";
import type { AnyEventsMap } from "@anion155/shared/event-emitter";
import { EventEmitter } from "@anion155/shared/event-emitter";
import type { PointValue } from "@anion155/shared/linear/point";
import { Point } from "@anion155/shared/linear/point";
import type { SizeValue } from "@anion155/shared/linear/size";
import { Size } from "@anion155/shared/linear/size";
import { OrderedMap } from "@anion155/shared/ordered-map";
import type { SchedulerCancelable } from "@anion155/shared/scheduler";
import { immidiateScheduler, rafScheduler } from "@anion155/shared/scheduler";
import { SignalState } from "@anion155/signals";
import { nanoid } from "nanoid/non-secure";

import TestMapPath from "@/assets/test_map/test_map.tmj?url";

import { loadImage } from "./image-resource";
import type { TMXMap } from "./tmx";
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
    this.config = Object.entries(config) as never;
  }

  #running: false | { id: SchedulerId; last: Record<Ticks | "tick", DOMHighResTimeStamp | undefined> } = false;
  start() {
    if (this.#running) return;
    const loop = () => {
      if (!this.#running) return;
      const now = performance.now();
      {
        const deltaTime = this.#running.last.tick ? now - this.#running.last.tick : 0;
        this.#running.last.tick = now;
        // @ts-expect-error - can't exclude tick from ticks here
        this.emit("tick", deltaTime);
      }
      for (const [name, minDiff] of this.config) {
        const deltaTime = this.#running.last[name] ? now - this.#running.last[name] : 0;
        if (!this.#running.last[name] || deltaTime >= minDiff) {
          this.#running.last[name] = now;
          // @ts-expect-error - can't exclude tick from ticks here
          this.emit(name, deltaTime);
        }
      }
      schedule();
    };
    const schedule = () => {
      const id = this.scheduler.schedule(loop);
      this.#running = { id, last: {} as never };
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
  cameraName: string;
};
class CanvasRendererLayer extends Entity {
  readonly root: HTMLDivElement;
  readonly size: Size;
  readonly cameraName: string;

  constructor({ root, size, cameraName, ...entityParams }: CanvasRendererLayerParams) {
    super(entityParams);
    this.root = root;
    this.size = Size.parseValue(size);
    this.cameraName = cameraName;
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
    const camera = Game.getGame(this).children.get(this.cameraName) as Camera | undefined;
    if (!camera || !(camera instanceof Camera)) return;
    ctx.save();
    ctx.translate(
      ...Point.project(size, camera.position.value, camera.scale.value, (size, position, scale) => size / 2 - Math.trunc(position * scale))._,
    );
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
  tileSize?: SizeValue;
};
class TiledMap extends Entity {
  readonly filePath: string;
  readonly tileSize?: Size;

  constructor({ filePath, tileSize, ...entityParams }: TiledMapParams) {
    super(entityParams);
    this.filePath = filePath;
    this.tileSize = tileSize !== undefined ? Size.parseValue(tileSize) : undefined;
  }

  #resource: TMXResource | null = null;
  get resource() {
    return this.#resource;
  }
  protected async _initialize(stack: AsyncDisposableStack): Promise<void> {
    const response = await fetch(this.filePath);
    const tmx = (await response.json()) as TMXMap;
    const images: HTMLImageElement[] = [];
    for (const tileset of tmx.tilesets) {
      if (!tileset.image) throw new DeveloperError("TMX: tileset without image is not suppoerted");
      images.push(await loadImage(this.filePath.substring(0, this.filePath.lastIndexOf("/")) + "/" + tileset.image));
    }
    this.#resource = new TMXResource(tmx, images);
    stack.append(() => (this.#resource = null));
  }

  readonly renderer = new (class TMXResourceRenderer extends CanvasRendererEntityComponent {
    get #entity(): TiledMap {
      return this.entity as TiledMap;
    }

    render({ ctx }: CanvasRendererContext, _deltaTime: DOMHighResTimeStamp): void {
      this.#entity.#resource?.renderMap(ctx, this.#entity.tileSize);
    }
  })(this, "renderer");
}

class BindingComponent<Value> extends SignalState<Value> implements EntityComponent {
  constructor(
    value: Value,
    readonly entity: Entity,
    readonly name: string = nanoid(),
  ) {
    super(value);
    entity.registerComponent(this);
  }
}

type CameraParams = EntityParams & { position: PointValue; scale?: SizeValue };
class Camera extends Entity {
  readonly position: BindingComponent<Point>;
  readonly scale: BindingComponent<Size>;
  constructor({ position, scale = new Size(1, 1), ...entityParams }: CameraParams) {
    super(entityParams);
    this.position = new BindingComponent(Point.parseValue(position), this, "position");
    this.scale = new BindingComponent(Size.parseValue(scale), this, "scale");
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
  readonly camera: Camera;
  constructor(root: HTMLDivElement) {
    super({ name: "test" });
    this.loop = new LoopEntityComponent({ frame: 1000 / 60 }, this, "loop");
    const tileSize = new Size(20, 20);
    this.canvasRenderer = new CanvasRendererLayer({ root, size: [800, 600], name: "renderer", parent: this, cameraName: "camera" });
    this.map = new TiledMap({ filePath: TestMapPath, name: "map", parent: this, tileSize });
    this.camera = new Camera({ position: [20, 15], scale: tileSize, name: "camera", parent: this });
  }

  protected async _initialize(stack: AsyncDisposableStack): Promise<void> {
    await super._initialize(stack);
    stack.append(this.loop.start());
    const startPos = this.camera.position.value;
    const startTime = performance.now();
    stack.append(
      this.loop.on("tick", () => {
        const overallProgress = ((performance.now() - startTime) % 4000) / 1000;
        const progress = overallProgress % 1;
        if (overallProgress < 1) {
          this.camera.position.value = startPos.add([progress * 10, 0]);
        } else if (overallProgress < 2) {
          this.camera.position.value = startPos.add([10, progress * 10]);
        } else if (overallProgress < 3) {
          this.camera.position.value = startPos.add([10 - progress * 10, 10]);
        } else if (overallProgress < 4) {
          this.camera.position.value = startPos.add([0, 10 - progress * 10]);
        }
      }),
    );
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
await main();
