import { describe, it, jest } from "@jest/globals";
import expect from "expect";
import { Component, ReactNode } from "react";

import { mergeRefs } from "./merge-refs";
import { render } from "./test-utils";

describe("mergeRefs()", () => {
  it("should pass refs", () => {
    class Test extends Component {
      render(): ReactNode {
        return null;
      }
    }
    const objRef = { current: null };
    const fnRef = jest.fn();
    const { unmount } = render(<Test ref={mergeRefs(objRef, fnRef, null)} />);
    expect(objRef.current).toBeInstanceOf(Test);
    expect(fnRef).toHaveBeenCalledWith(expect.any(Test));
    unmount();
    expect(objRef.current).toBeNull();
    expect(fnRef).toHaveBeenCalledWith(null);
  });
});
