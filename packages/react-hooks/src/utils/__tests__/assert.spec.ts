import { expect, jest, test } from "@jest/globals";

import { assert, warning } from "../assert";

test("assert", () => {
  const message = "DeveloperError: assert message";

  expect(assert(5, message)).toBeUndefined();
  expect(() => assert(undefined, message)).toThrow(message);
  expect(() => assert(null, message)).toThrow(message);
  expect(() => assert(0, message)).toThrow(message);
  expect(() => assert(false, message)).toThrow(message);
});

test("warning", () => {
  const message = "DeveloperError: assert message";
  const warn = jest.spyOn(console, "warn");

  expect(warning(5, message)).toBeUndefined();
  expect(warning(undefined, message)).toBeUndefined();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(message);
});
