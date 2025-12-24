import { defineMethod } from "../object";

declare global {
  interface Math {
    /** Returns the clamped to {@link min} and {@link max} {@link value}. */
    clamp(min: number, value: number, max: number): number;
  }
}
defineMethod(Math, "clamp", function clamp(min, value, max) {
  return Math.min(Math.max(min, value), max);
});

export {};
