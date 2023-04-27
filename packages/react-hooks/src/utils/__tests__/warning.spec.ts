import { expect, jest, test } from "@jest/globals";

import { warning } from "../warning";

test("warning", () => {
  const message = "DeveloperError: assert message";
  const warn = jest.spyOn(console, "warn");

  expect(warning(5, message)).toBeUndefined();
  expect(warning(undefined, message)).toBeUndefined();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(message);
});
