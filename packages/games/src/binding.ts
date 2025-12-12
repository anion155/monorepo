import { boundParseValue, Size } from "@anion155/linear";
import type { Point2DValue } from "@anion155/linear/point-2d";
import { Point2D } from "@anion155/linear/point-2d";
import type { SizeValue } from "@anion155/linear/size";
import type { SignalBindingArgument } from "@anion155/signals";
import { SignalBinding } from "@anion155/signals";
import { nanoid } from "nanoid/non-secure";

import type { Entity, EntityComponentParams, IEntityComponent } from "./entity";

export type BindingComponentParams<Value, Argument = never> = EntityComponentParams & {
  initial: SignalBindingArgument<Value | Argument>;
} & IfEquals<
    Exclude<Argument, Value>,
    never,
    { parser?: (argument: Value | NoInfer<Argument>) => Value },
    { parser: (argument: Value | NoInfer<Argument>) => Value }
  >;

export class BindingComponent<Value, Argument = never> extends SignalBinding<Value, Argument> implements IEntityComponent {
  readonly entity: Entity;
  readonly name: string;

  constructor({ initial, parser, entity, name = nanoid() }: BindingComponentParams<Value, Argument>) {
    super(initial, parser as never);
    this.entity = entity;
    this.name = name;
    entity.registerComponent(this);
  }
}

const parserWithDefault =
  <Argument, Value>(parser: (argument: Exclude<Argument, null | undefined>) => Value) =>
  (argument: Argument): Value | Extract<Argument, null | undefined> => {
    if (argument === null || argument === undefined) return argument as never;
    return parser(argument as never);
  };
type Default<Nullable extends null> = Nullable extends null ? null | undefined : never;

export type Point2DBindingArgument<Nullable extends null = never> = SignalBindingArgument<Point2DValue | Default<Nullable>>;
export type Point2DComponentParams<Nullable extends null = never> = EntityComponentParams & {
  initial: SignalBindingArgument<Point2D | Point2DValue | Default<Nullable>>;
};
export class Point2DComponent<Nullable extends null = never> extends BindingComponent<Point2D, Point2DValue | Default<Nullable>> {
  constructor(params: Point2DComponentParams<Nullable>) {
    super({ ...params, parser: parserWithDefault(boundParseValue(Point2D)) as never });
  }
}

export type SizeBindingArgument<Nullable extends null = never> = SignalBindingArgument<SizeValue | Default<Nullable>>;
export type SizeComponentParams<Nullable extends null = never> = EntityComponentParams & {
  initial: SignalBindingArgument<Size | SizeValue | Default<Nullable>>;
};
export class SizeComponent<Nullable extends null = never> extends BindingComponent<Size, SizeValue | Default<Nullable>> {
  constructor(params: SizeComponentParams<Nullable>) {
    super({ ...params, parser: parserWithDefault(boundParseValue(Size)) as never });
  }
}
