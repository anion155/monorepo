import { hasTypedField, is, isObject } from "@anion155/shared/is";
import { Maybe, MaybePromise } from "@anion155/shared/maybe";
import { escapes } from "@anion155/shared/misc";
import { applyConsoleFormat } from "@anion155/shared/misc/apply-console-format";
import { readFile } from "fs/promises";
import { cdRoot } from "./cd-root";
import { ScriptLogger } from "./logger";

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

export async function scriptHeader<PKG extends PackageJson>(logger: ScriptLogger, name: string) {
  logger.header?.(`${name}...`);
  await cdRoot();
  const pkg: PKG = await readFile("./package.json", "utf-8").then(JSON.parse);
  if (logger.header) process.stdout.write(escapes.cursor.moveUp(1) + escapes.erase.clearLine);
  logger.header?.(`${name} ${applyConsoleFormat("white", `[${pkg.name}]`)}`);
  return pkg;
}
