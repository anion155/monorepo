import type { AnimationConfig, AnimationsConfig } from "./animation";
import type { KeysCode } from "./keycodes";
import { Keys } from "./keycodes";
import { UserInputAction, UserInputEntityComponent } from "./user-input";

export type MovingDirection = "away" | "towards" | "left" | "right";
export type MovingSpeed = "run" | "walk";
export type MovingAnimationConfig = AnimationsConfig<MovingDirection> & Partial<AnimationsConfig<`${MovingDirection}-${MovingSpeed | "stand"}`>>;
export type MovingState = { direction: MovingDirection; moving: false | MovingSpeed };

export class MovingAnimation {
  constructor(readonly config: MovingAnimationConfig) {}

  #last: (MovingState & { start: number }) | null = null;
  interpolate(state: MovingState) {
    const now = performance.now();
    if (!this.#last || this.#last.direction !== state.direction || this.#last.moving !== state.moving) {
      this.#last = { ...state, start: now };
    }
    const config = this.config;
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

export class MovingControlls extends UserInputEntityComponent {
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

  onKeyDown(code: KeysCode) {
    this.#actions.forEach((action) => action.onInputDown(code));
  }
  onKeyUp(code: KeysCode) {
    this.#actions.forEach((action) => action.onInputUp(code));
  }
}
