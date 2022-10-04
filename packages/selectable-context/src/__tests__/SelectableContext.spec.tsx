import { describe, jest, expect, test } from "@jest/globals";
import { render } from "@testing-library/react";
import type { FC } from "react";

import { createSelectableContext } from "../createSelectableContext";
import { INVALID_CONTEXT_ERROR_MESSAGE } from "../internal";

describe("SelectableContext components group", () => {
  const context = {
    type: "test-default-context-value",
    value: 0,
    meta: "blah",
  };
  const Context = createSelectableContext<{ value: number; meta: string }>(
    context
  );

  const renderer = jest
    .fn<(value: any) => ReturnType<FC>>()
    .mockReturnValue(null);
  const consumer = <Context.Consumer>{renderer}</Context.Consumer>;

  const valueRenderer = jest
    .fn<(value: any) => ReturnType<FC>>()
    .mockReturnValue(null);
  const valueConsumer = (
    <Context.Consumer<number> selector={(v) => v.value}>
      {valueRenderer}
    </Context.Consumer>
  );

  const metaRenderer = jest
    .fn<(value: any) => ReturnType<FC>>()
    .mockReturnValue(null);
  const metaConsumer = (
    <Context.Consumer<string> selector={(v) => v.meta}>
      {metaRenderer}
    </Context.Consumer>
  );

  const metaChange = { ...context, meta: `${context.meta}-alt` };
  const valueChange = { ...metaChange, value: metaChange.value + 1 };

  test("default value", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    render(consumer);
    expect(warnSpy).toHaveBeenCalledWith(INVALID_CONTEXT_ERROR_MESSAGE);
    expect(renderer).toHaveBeenCalledWith(context);
  });

  test("with value from context", () => {
    render(<Context.Provider value={context}>{consumer}</Context.Provider>);
    expect(renderer).toHaveBeenCalledWith(context);
  });

  test("render count", () => {
    const ctx = render(
      <Context.Provider value={context}>
        {valueConsumer}
        {metaConsumer}
      </Context.Provider>
    );
    expect(valueRenderer).toHaveBeenCalledTimes(1);
    expect(metaRenderer).toHaveBeenCalledTimes(1);
    ctx.rerender(
      <Context.Provider value={metaChange}>
        {valueConsumer}
        {metaConsumer}
      </Context.Provider>
    );
    expect(valueRenderer).toHaveBeenCalledTimes(1);
    expect(metaRenderer).toHaveBeenCalledTimes(2);
    ctx.rerender(
      <Context.Provider value={valueChange}>
        {valueConsumer}
        {metaConsumer}
      </Context.Provider>
    );
    expect(valueRenderer).toHaveBeenCalledTimes(2);
    expect(metaRenderer).toHaveBeenCalledTimes(2);
  });
});
