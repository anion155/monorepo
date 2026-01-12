import type { ConsoleFormats } from "../misc";
import { applyConsoleFormat } from "../misc";
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

declare global {
  interface String {
    /** Splits string into lines wrapping around words. */
    wrap(width: number, breakWords?: boolean): string[];
  }
}
defineMethod(String.prototype, "wrap", function wrap(width: number, breakWords = false) {
  const re = new RegExp(`.{1,${width}}` + (!breakWords ? "([\\s\u200B]+|$)|[^\\s\u200B]+?([\\s\u200B]+|$)" : ""), "g");
  return this.split(/\r\n|\n/g).flatMap((hardLine) => {
    const match = hardLine.match(re) ?? [hardLine];
    return match.map((line) => line.trim());
  });
});

declare global {
  interface String {
    /** Formats {@link this} using {@link formats}. */
    consoleFormat(formats: ConsoleFormats, disabled?: boolean): string;
  }
}
defineMethod(String.prototype, "consoleFormat", function consoleFormat(formats, disabled) {
  return applyConsoleFormat(formats, this as string, disabled);
});

export {};
