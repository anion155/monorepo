import "./polyfils";
import "./shell";

import { DeveloperError } from "@anion155/shared/errors";
import { hasTypedField, is, isObject } from "@anion155/shared/is";
import { Maybe, MaybePromise } from "@anion155/shared/maybe";
import { escapes } from "@anion155/shared/misc";
import { assignFields } from "@anion155/shared/object";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { $, cd } from "zx";
import { ARGV, CommandParserBreak, OptionParserBreak, UsageError } from "./argv";
import { LoggerSink, LogLevels, ScriptLogger } from "./logger";

type MainContext<_LoggerSink extends LoggerSink> = {
  stack: DisposableStack;
  logger: _LoggerSink extends ScriptLogger ? _LoggerSink : ScriptLogger;
};
let context: MainContext<ScriptLogger> | undefined;

type Main<Result extends void | Promise<void>, _LoggerSink extends LoggerSink> = (argv: string[], context: MainContext<_LoggerSink>) => Result;
export function main<Result extends void | Promise<void>, _LoggerSink extends LoggerSink>(
  ...params: [main: Main<Result, _LoggerSink>] | [logger: _LoggerSink, main: Main<Result, _LoggerSink>]
): MaybePromise<Result> {
  if (context !== undefined) throw new DeveloperError("main() already setup");

  let logger: ScriptLogger | _LoggerSink | undefined;
  let main: Main<Result, _LoggerSink>;
  [logger, main] = params.length === 2 ? params : [undefined, params[0]];
  if (!(logger instanceof ScriptLogger)) logger = new ScriptLogger(undefined, { sink: logger });
  const stack = new DisposableStack();
  const dispose = () => stack.dispose();
  process.addListener("exit", dispose);
  process.addListener("SIGINT", dispose);
  stack.append(() => {
    process.removeListener("exit", dispose);
    process.removeListener("SIGINT", dispose);
  });
  context = { stack, logger };
  return Maybe.try(() => main(ARGV.slice(), context as never)).then(
    () => {
      context = undefined;
      dispose();
    },
    (error) => {
      context = undefined;
      let result = 1;
      if (error instanceof UsageError) {
        logger.error?.(error.message.consoleFormat("red"));
        logger.plain.error?.(error.help());
      } else if (error instanceof OptionParserBreak) {
        result = 0;
      } else if (error instanceof CommandParserBreak) {
        result = 0;
      } else {
        const message = is(error, Error) || (isObject(error) && hasTypedField(error, "message", "string")) ? error.message.consoleFormat("red") : "";
        logger.error?.("Failed:".consoleFormat("red"), message, "\n", error);
      }
      dispose();
      process.exit(result);
    },
  ) as never;
}

export function fatal(message: string, code = 1): never {
  const logger = context?.logger ?? console;
  logger.error?.(message);
  process.exit(code);
}

export function doInCwd<Result>(cwd: string, fn: () => Result): Result {
  const prev = process.cwd();
  cd(cwd);
  return Maybe.try(fn).finally(() => cd(prev)) as never;
}

let __npmRoot: string | undefined;
export async function findNpmRoot() {
  if (__npmRoot) return __npmRoot;
  let cwd = process.cwd();
  const isRoot = process.platform === "win32" ? () => cwd.match(/^[a-zA-Z]:\\$/) : () => cwd === "/";
  while (true) {
    try {
      await stat(path.join(cwd, "node_modules"));
      __npmRoot = cwd;
      return cwd;
    } catch {
      if (isRoot()) throw new Error("Npm root dir not found");
      cwd = path.dirname(cwd);
    }
  }
}

export async function cdNpmRoot() {
  cd(await findNpmRoot());
}

export async function doInNpmRoot<Result>(fn: () => Result): Promise<Awaited<Result>> {
  return await doInCwd(await findNpmRoot(), fn);
}

export async function scriptHeader<PKG extends PackageJson>(message: string) {
  const logger = context?.logger;
  logger?.header?.(`${message}...`);
  const pkg: PKG = await doInNpmRoot(() => readFile("package.json", "utf-8").then(JSON.parse));
  if (logger?.header) process.stdout.write(escapes.cursor.moveUp(1) + escapes.erase.clearLine);
  logger?.header?.(`${message} ${`[${pkg.name}]`.consoleFormat("white")}`);
  return pkg;
}

export const scriptRunner = (pkg: PackageJson) => {
  const logger = context?.logger;
  return assignFields(
    (scriptName: string, envName?: string) => {
      if (envName && process.env[envName]) {
        logger?.log?.(`executing script:`);
        logger?.get(LogLevels.log, { header: false, formats: "grey" })?.(`> ${process.env[envName]}`);
        return $`bash -c ${process.env[envName]}`;
      }
      if (hasTypedField(pkg.scripts, scriptName, "string")) {
        logger?.log?.(`executing '${scriptName}' script:`);
        logger?.get(LogLevels.log, { header: false, formats: "grey" })?.(`> ${pkg.scripts[scriptName]}`);
        return $`pnpm run ${scriptName}`;
      }
      return false;
    },
    {
      has(scriptName: string, envName?: string) {
        if (envName && process.env[envName]) return true;
        return hasTypedField(pkg.scripts, scriptName, "string");
      },
    },
  );
};
