import { defineMethod } from "../object";

declare global {
  interface String {
    /**
     * Trim string by {@link size} with {@link display} character
     * @param {string} [display='…']
     */
    overflow(size: number, display?: string): string;
  }
}
defineMethod(String.prototype, "overflow", function overflow(size: number, display = "…") {
  if (this.length <= size) return this as string;
  return this.substring(0, size - display.length) + display;
});

export {};
