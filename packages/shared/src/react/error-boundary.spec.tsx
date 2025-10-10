import { describe, it, jest } from "@jest/globals";
import expect from "expect";

import { doThrow } from "../do";
import { createErrorClass } from "../errors";
import { ErrorBoundary } from "./error-boundary";
import { act, render } from "./test-utils";

describe("<ErrorBoundary />", () => {
  class TestError extends createErrorClass("TestError") {}
  const expectErrorLog = ({ name = "ErrorComponent", tries = 1 }: { name?: string; tries?: number } = {}) => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const dispose = errorSpy[Symbol.dispose];
    return Object.assign(errorSpy, {
      [Symbol.dispose]() {
        expect(errorSpy.mock.calls).toStrictEqual(
          Array.from({ length: tries }, () => [
            expect.any(String),
            new TestError(),
            `The above error occurred in the <${name}> component.`,
            "React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.",
          ]),
        );
        dispose.call(this);
      },
    });
  };

  it("should catch error and display fallback", () => {
    using _errorSpy = expectErrorLog();
    const ErrorComponent = () => doThrow(new TestError());
    const component = render(<ErrorBoundary fallback="error" children={<ErrorComponent />} />);
    expect(component.asFragment()).toHaveTextContent("error");
  });

  it("should render fallback function", () => {
    using _errorSpy = expectErrorLog();
    const ErrorComponent = () => doThrow(new TestError());
    const fallback = (..._params: unknown[]) => "error";
    const component = render(<ErrorBoundary fallback={fallback} children={<ErrorComponent />} />);
    expect(component.asFragment()).toHaveTextContent("error");
  });

  it(".reset() should reset error state", () => {
    using _errorSpy = expectErrorLog();
    let error = true;
    const ErrorComponent = () => (error ? doThrow(new TestError()) : "no-error");
    const fallbackSpy = jest.fn((..._params: unknown[]) => "error");
    const component = render(<ErrorBoundary fallback={fallbackSpy} children={<ErrorComponent />} />);
    expect(component.asFragment()).toHaveTextContent("error");

    act(() => {
      error = false;
      (fallbackSpy.mock.lastCall![1] as never as ErrorBoundary).reset();
    });
    expect(component.asFragment()).toHaveTextContent("no-error");
  });

  it("should fill stats", async () => {
    using _errorSpy = expectErrorLog({ tries: 2 });
    const ErrorComponent = () => doThrow(new TestError());
    const fallbackSpy = jest.fn((..._params: unknown[]) => "error");
    render(<ErrorBoundary fallback={fallbackSpy} children={<ErrorComponent />} />);
    const boundary = fallbackSpy.mock.lastCall![1] as never as ErrorBoundary;
    expect(boundary.stats).toStrictEqual([new TestError()]);
    await act(() => {
      boundary.reset();
      return Promise.resolve();
    });
    expect(boundary.stats).toStrictEqual([new TestError(), new TestError()]);
  });

  it(".clean() should clean stats", () => {
    using _errorSpy = expectErrorLog({ tries: 3 });
    const ErrorComponent = () => doThrow(new TestError());
    const fallbackSpy = jest.fn((..._params: unknown[]) => "error");
    render(<ErrorBoundary fallback={fallbackSpy} children={<ErrorComponent />} />);
    const boundary = fallbackSpy.mock.lastCall![1] as never as ErrorBoundary;
    act(() => boundary.reset());
    expect(boundary.stats).toStrictEqual([new TestError(), new TestError()]);

    act(() => boundary.clean());
    expect(boundary.stats).toStrictEqual([new TestError()]);
  });

  it("ErrorBoundary.with() should wrap component into HOC", () => {
    using _errorSpy = expectErrorLog({ name: "_ErrorComponent" });
    const _ErrorComponent = () => doThrow(new TestError());
    const ErrorComponent = ErrorBoundary.with(_ErrorComponent, "fallback");
    expect(ErrorComponent.displayName).toBe("ErrorBoundary(_ErrorComponent)");
    const component = render(<ErrorComponent />);
    expect(component.asFragment()).toHaveTextContent("fallback");
  });
});
