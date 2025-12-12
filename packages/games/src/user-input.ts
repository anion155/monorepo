import { bound } from "@anion155/shared/decorators";

import type { EntityParams } from "./entity";
import { Entity, EntityComponent } from "./entity";
import { Game } from "./game";
import type { KeysCode } from "./keycodes";

export abstract class UserInputEntityComponent<Value = void> extends EntityComponent<Value> {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  onKeyDown(code: KeysCode, event: KeyboardEvent): void {}
  onKeyDownRepeat(code: KeysCode, event: KeyboardEvent): void {}
  onKeyUp(code: KeysCode, event: KeyboardEvent | FocusEvent): void {}
  onChange(event: KeyboardEvent | FocusEvent): void {}
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export class UserInput extends Entity {
  #pressed: KeysCode[] = [];
  pressed(...codes: KeysCode[]): KeysCode[] {
    return codes.length === 0 ? this.#pressed.slice() : this.#pressed.filter((code) => codes.includes(code));
  }

  constructor(params: EntityParams) {
    super(params, (stack) => {
      document.addEventListener("blur", this.onBlur);
      stack.append(() => document.removeEventListener("blur", this.onBlur));
      document.addEventListener("keydown", this.onKeyDown);
      stack.append(() => document.removeEventListener("keydown", this.onKeyDown));
      document.addEventListener("keyup", this.onKeyUp);
      stack.append(() => document.removeEventListener("keyup", this.onKeyUp));
    });
  }

  protected emitKeyboard<Event extends Extract<keyof UserInputEntityComponent, `on${string}`>>(
    event: Event,
    ...params: Parameters<UserInputEntityComponent[Event]>
  ) {
    Game.getGame(this)
      .eachNestedComponents(UserInputEntityComponent)
      // @ts-expect-error - strange types
      .forEach((component) => component[event](...params));
  }

  @bound
  protected onBlur(event: FocusEvent) {
    this.#pressed.forEach((code) => this.emitKeyboard("onKeyUp", code, event));
    this.emitKeyboard("onChange", event);
    this.#pressed = [];
  }

  @bound
  protected onKeyDown(event: KeyboardEvent) {
    const code = event.code as KeysCode;
    if (event.repeat || this.#pressed.includes(code)) {
      this.emitKeyboard("onKeyDownRepeat", code, event);
      return;
    }
    this.#pressed.unshift(code);
    this.emitKeyboard("onKeyDown", code, event);
    this.emitKeyboard("onChange", event);
  }

  @bound
  protected onKeyUp(event: KeyboardEvent) {
    const code = event.code as KeysCode;
    const index = this.#pressed.indexOf(code);
    if (index < 0) return;
    this.#pressed.splice(index, 1);
    this.emitKeyboard("onKeyUp", code, event);
    this.emitKeyboard("onChange", event);
  }
}

export type UserInputActionConfig<Actions extends string, Inputs extends string> = { [I in Inputs]?: Actions };
export class UserInputAction<Actions extends string, Inputs extends string> {
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
