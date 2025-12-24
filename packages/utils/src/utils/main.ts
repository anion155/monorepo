import { hasTypedField, is, isObject } from "@anion155/shared/is";
import { Maybe, MaybePromise } from "@anion155/shared/maybe";
import { applyConsoleFormat } from "@anion155/shared/misc/apply-console-format";

export function main<Result extends void | Promise<void>>(main: (stack: DisposableStack) => Result): MaybePromise<Result> {
  const stack = new DisposableStack();
  const dispose = () => stack.dispose();
  process.addListener("exit", dispose);
  process.addListener("SIGINT", dispose);
  stack.append(() => {
    process.removeListener("exit", dispose);
    process.removeListener("SIGINT", dispose);
  });
  return Maybe.try(() => main(stack)).then(
    () => dispose(),
    (error) => {
      const message =
        is(error, Error) || (isObject(error) && hasTypedField(error, "message", "string")) ? applyConsoleFormat("red", error.message) : "";
      console.error(applyConsoleFormat("red", "Failed:"), message, "\n", error);
      dispose();
    },
  ) as never;
}
