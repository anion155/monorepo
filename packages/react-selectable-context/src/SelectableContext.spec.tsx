import { render } from "@anion155/shared/react";
import { describe, expect, it, jest } from "@jest/globals";

import { createSelectableContext } from "./index";

describe("SelectableContext components group", () => {
  const context = {
    type: "test-default-context-value",
    value: 0,
    meta: "blah",
  };
  const Context = createSelectableContext<{ value: number; meta: string }>(context);

  const renderer = jest.fn(() => null);
  const consumer = <Context.Consumer>{renderer}</Context.Consumer>;

  const valueRenderer = jest.fn(() => null);
  const valueSelector = <Context.Selector selector={(v) => v.value}>{valueRenderer}</Context.Selector>;

  const metaRenderer = jest.fn(() => null);
  const metaSelector = <Context.Selector selector={(v) => v.meta}>{metaRenderer}</Context.Selector>;

  const metaChange = { ...context, meta: `${context.meta}-alt` };
  const valueChange = { ...metaChange, value: metaChange.value + 1 };
  const typeChange = { ...valueChange, type: "test-changed-context-value" };

  it("default value", () => {
    render(consumer);
    expect(renderer).toHaveBeenCalledWith(context);
  });

  it("with value from context", () => {
    render(<Context.Provider value={context}>{consumer}</Context.Provider>);
    expect(renderer).toHaveBeenCalledWith(context);
  });

  it("render count", () => {
    const ctx = render(
      <Context.Provider value={context}>
        {valueSelector}
        {metaSelector}
      </Context.Provider>,
    );
    expect(valueRenderer).toHaveBeenCalledTimes(1);
    expect(metaRenderer).toHaveBeenCalledTimes(1);

    ctx.rerender(
      <Context.Provider value={metaChange}>
        {valueSelector}
        {metaSelector}
      </Context.Provider>,
    );
    expect(valueRenderer).toHaveBeenCalledTimes(1);
    expect(metaRenderer).toHaveBeenCalledTimes(2);

    ctx.rerender(
      <Context.Provider value={valueChange}>
        {valueSelector}
        {metaSelector}
      </Context.Provider>,
    );
    expect(valueRenderer).toHaveBeenCalledTimes(2);
    expect(metaRenderer).toHaveBeenCalledTimes(2);

    ctx.rerender(
      <Context.Provider value={typeChange}>
        {valueSelector}
        {metaSelector}
      </Context.Provider>,
    );
    expect(valueRenderer).toHaveBeenCalledTimes(2);
    expect(metaRenderer).toHaveBeenCalledTimes(2);
  });
});
