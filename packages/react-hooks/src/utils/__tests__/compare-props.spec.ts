import { expect, test } from "@jest/globals";

import { compareProps } from "../compare-props";

test("compareProps", () => {
  const instance1 = { value: "a" };
  const instance2 = { value: "a" };

  expect(compareProps([1, "blah", instance1], [1, "blah", instance1])).toBe(
    true
  );
  expect(compareProps([1, "blah"], [2, "blah"])).toBe(false);
  expect(compareProps([1, "blah", instance1], [1, "blah"])).toBe(false);
  expect(compareProps([1, "blah", instance1], [1, "blah", instance2])).toBe(
    false
  );
});
