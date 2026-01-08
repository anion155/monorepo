import "./shell";

import { hasTypedField, is, isObject } from "@anion155/shared/is";
import { Maybe, MaybePromise } from "@anion155/shared/maybe";
import { escapes } from "@anion155/shared/misc";
import { readFile } from "fs/promises";
import { CommandParserBreak, OptionParserBreak, UsageError } from "./argv";
import { cdRoot } from "./cd-root";
import { ScriptLogger } from "./logger";

export function fatal(message: string, code = 1): never {
  console.error(message.consoleFormat("red"));
  process.exit(code);
}

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
      let result = 1;
      if (error instanceof UsageError) {
        console.error(error.message.consoleFormat("red"));
        console.error(error.help());
      } else if (error instanceof OptionParserBreak) {
        result = 0;
      } else if (error instanceof CommandParserBreak) {
        result = 0;
      } else {
        const message = is(error, Error) || (isObject(error) && hasTypedField(error, "message", "string")) ? error.message.consoleFormat("red") : "";
        console.error("Failed:".consoleFormat("red"), message, "\n", error);
      }
      dispose();
      process.exit(result);
    },
  ) as never;
}

export async function scriptHeader<PKG extends PackageJson>(logger: ScriptLogger, name: string) {
  logger.header?.(`${name}...`);
  await cdRoot();
  const pkg: PKG = await readFile("./package.json", "utf-8").then(JSON.parse);
  if (logger.header) process.stdout.write(escapes.cursor.moveUp(1) + escapes.erase.clearLine);
  logger.header?.(`${name} ${`[${pkg.name}]`.consoleFormat("white")}`);
  return pkg;
}
