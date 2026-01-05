import "./string";

import { describe, expect, it } from "@jest/globals";

import { applyConsoleFormat } from "../misc";

describe("String extensions", () => {
  describe("this.overflow()", () => {
    it("should return overflowed text", () => {
      expect("test".overflow(10)).toBe("test");
      expect("Incididunt irure.".overflow(10)).toBe("Incididun…");
    });
  });

  describe("this.wrap()", () => {
    it("should return wrapped text", () => {
      expect("test".wrap(10)).toStrictEqual(["test"]);
      const longText =
        "Excepteur in culpa aliqua pariatur magna officia esse amet minim reprehenderit laboris do ipsum est. Consequat ad incididunt consequat dolor qui velit irure nisi. Dolor fugiat velit aliqua officia culpa deserunt enim irure dolore quis exercitation anim elit eu.";
      expect(longText.wrap(40)).toStrictEqual([
        "Excepteur in culpa aliqua pariatur magna",
        "officia esse amet minim reprehenderit",
        "laboris do ipsum est. Consequat ad",
        "incididunt consequat dolor qui velit",
        "irure nisi. Dolor fugiat velit aliqua",
        "officia culpa deserunt enim irure dolore",
        "quis exercitation anim elit eu.",
      ]);
      expect(longText.wrap(40, true)).toStrictEqual([
        "Excepteur in culpa aliqua pariatur magna",
        "officia esse amet minim reprehenderit l",
        "aboris do ipsum est. Consequat ad incidi",
        "dunt consequat dolor qui velit irure nis",
        "i. Dolor fugiat velit aliqua officia cul",
        "pa deserunt enim irure dolore quis exerc",
        "itation anim elit eu.",
      ]);
    });
  });

  describe("this.consoleFormat()", () => {
    it("should format string same way applyConsoleFormat() does", () => {
      expect("test".consoleFormat("bold")).toBe(applyConsoleFormat("bold", "test"));
    });
  });
});
