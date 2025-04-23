import { render } from "@anion155/shared/react";
import { expect, it, jest } from "@jest/globals";
import { createContext } from "react";

it("React.Context components group, Context.Consumer component render count", () => {
  const context = { type: "test-context-value", value: 1, meta: "blah" };
  const metaChange = { ...context, meta: `${context.meta}-alt` };
  const valueChange = { ...context, value: context.value + 1 };

  const Context = createContext<{ value: number; meta: string }>(undefined as never);
  const renderer = jest.fn(() => null);

  const consumer = <Context.Consumer>{renderer}</Context.Consumer>;

  const ctx = render(<Context.Provider value={context}>{consumer}</Context.Provider>);
  expect(renderer).toHaveBeenCalledTimes(1);

  ctx.rerender(<Context.Provider value={metaChange}>{consumer}</Context.Provider>);
  expect(renderer).toHaveBeenCalledTimes(2);

  ctx.rerender(<Context.Provider value={valueChange}>{consumer}</Context.Provider>);
  expect(renderer).toHaveBeenCalledTimes(3);
});
