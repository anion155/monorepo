import expect from "expect";
import { diff } from "jest-diff";

function compareErrorsDeep(left: Error, right: Error) {
  if (!(left instanceof Error) || !(right instanceof Error)) return left === right;
  if (left.constructor !== right.constructor) return false;
  if (String(left) !== String(right)) return false;
  const leftKeys = Object.keys(left).filter((key) => !["message", "stack", "name"].includes(key));
  const rightKeys = Object.keys(right).filter((key) => !["message", "stack", "name"].includes(key));
  if (leftKeys.length !== rightKeys.length) return false;
  leftKeys.sort();
  rightKeys.sort();
  for (let index = 0; index < leftKeys.length; index += 1) {
    if (leftKeys[index] !== rightKeys[index]) return false;
    if (!compareErrorsDeep(left[leftKeys[index] as never], right[rightKeys[index] as never])) return false;
  }
  return true;
}

expect.extend({
  toStrictThrow(actual: unknown, expected: Error) {
    if (!(expected instanceof Error)) throw new TypeError("should be called with Error instance");
    if (this.promise === "") {
      if (typeof actual !== "function") throw new TypeError("should be called with function");
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        actual();
        throw new TypeError("function did not throw");
      } catch (error) {
        actual = error as never;
      }
    }
    if (this.promise === "resolves") throw new TypeError("should be called with rejected promise only");
    if (!(actual instanceof Error)) throw new TypeError("should be called with Error instance");
    const pass = compareErrorsDeep(actual, expected);
    const options = {
      comment: "deep error compare",
      isNot: this.isNot,
      promise: this.promise,
    };
    return {
      actual,
      pass,
      message: pass
        ? () =>
            this.utils.matcherHint("toStrictThrow", undefined, undefined, options) +
            "\n\n" +
            `Expected: not ${this.utils.printExpected(expected)}\n` +
            `Received: ${this.utils.printReceived(actual)}`
        : () => {
            const diffString = diff(expected, actual, { expand: this.expand });
            return (
              this.utils.matcherHint("toBe", undefined, undefined, options) +
              "\n\n" +
              (diffString && diffString.includes("- Expect")
                ? `Difference:\n\n${diffString}`
                : `Expected: ${this.utils.printExpected(expected)}\n` + `Received: ${this.utils.printReceived(actual)}`)
            );
          },
    };
  },
});

declare module "expect" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Matchers<R> {
    /**  */
    toStrictThrow(expected: Error): void;
  }
}

export {};
