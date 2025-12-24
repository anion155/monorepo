import expect from "expect";
import { diff } from "jest-diff";

export function compareErrorsDeep(left: unknown, right: unknown) {
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
    const leftValue = left[leftKeys[index] as never];
    const rightValue = right[rightKeys[index] as never];
    if (leftValue !== rightValue && !compareErrorsDeep(leftValue, rightValue)) return false;
  }
  return true;
}

expect.extend({
  toStrictThrow(actual: unknown, expected: Error) {
    if (!(expected instanceof Error)) throw new TypeError("should be called with Error instance");
    if (this.promise === "") {
      if (typeof actual === "function") {
        let didThrow = false;
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          actual();
        } catch (error) {
          didThrow = true;
          actual = error as never;
        }
        if (!didThrow) throw new TypeError("function did not throw");
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
              (diffString?.includes("- Expect")
                ? `Difference:\n\n${diffString}`
                : `Expected: ${this.utils.printExpected(expected)}\n` + `Received: ${this.utils.printReceived(actual)}`)
            );
          },
    };
  },
});

declare module "expect" {
  interface Matchers<R> {
    /** Used to test error thrown by actual value, test using deep comparison. */
    toStrictThrow(expected: unknown): R;
  }
}

export {};
