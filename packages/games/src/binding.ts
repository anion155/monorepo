import type { PointValue } from "@anion155/shared/linear/point";
import { Point } from "@anion155/shared/linear/point";
import type { SizeValue } from "@anion155/shared/linear/size";
import { Size } from "@anion155/shared/linear/size";
import { SignalBinding } from "@anion155/signals";
import { nanoid } from "nanoid/non-secure";

import type { Entity, EntityComponentParams, IEntityComponent } from "./entity";

export class BindingComponent<Value> extends SignalBinding<Value> implements IEntityComponent {
  readonly entity: Entity;
  readonly name: string;

  constructor(value: BindingArgument<Value>, { entity, name = nanoid() }: EntityComponentParams) {
    super(value);
    this.entity = entity;
    this.name = name;
    entity.registerComponent(this);
  }
}

export type BindingArgument<Argument> = Argument | { (): Argument };
export const parseBindingArgument = <Value, Argument>(parser: (argument: Argument) => Value, argument: BindingArgument<NoInfer<Argument>>) => {
  return typeof argument === "function" ? () => parser((argument as () => Argument)()) : parser(argument);
};

export type PointComponentArg = BindingArgument<PointValue>;
export class PointComponent extends BindingComponent<Point> {
  constructor(argument: BindingArgument<PointValue>, params: EntityComponentParams) {
    super(parseBindingArgument(Point.parseValue, argument), params);
  }
}

export type SizeComponentArg = BindingArgument<SizeValue>;
export class SizeComponent extends BindingComponent<Size> {
  constructor(argument: BindingArgument<SizeValue>, params: EntityComponentParams) {
    super(parseBindingArgument(Size.parseValue, argument), params);
  }
}
