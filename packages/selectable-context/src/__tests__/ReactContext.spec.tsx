import { jest, expect, test } from "@jest/globals";
import { render } from "@testing-library/react";
import type { FC } from "react";
import { createContext } from "react";

test("React.Context components group, Context.Consumer component render count", () => {
  /* eslint-disable react/jsx-no-constructed-context-values -- this is not render function */
  const context = { type: "test-context-value", value: 1, meta: "blah" };
  const metaChange = { ...context, meta: `${context.meta}-alt` };
  const valueChange = { ...context, value: context.value + 1 };
  /* eslint-enable react/jsx-no-constructed-context-values */

  const Context = createContext<{ value: number; meta: string }>(
    undefined as never
  );
  const renderer = jest
    .fn<(value: any) => ReturnType<FC>>()
    .mockReturnValue(null);

  const consumer = <Context.Consumer>{renderer}</Context.Consumer>;

  const ctx = render(
    <Context.Provider value={context}>{consumer}</Context.Provider>
  );
  expect(renderer).toHaveBeenCalledTimes(1);
  ctx.rerender(
    <Context.Provider value={metaChange}>{consumer}</Context.Provider>
  );
  expect(renderer).toHaveBeenCalledTimes(2);
  ctx.rerender(
    <Context.Provider value={valueChange}>{consumer}</Context.Provider>
  );
  expect(renderer).toHaveBeenCalledTimes(3);
});
