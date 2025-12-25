import { hasTypedField } from "@anion155/shared/is";
import { applyConsoleFormat, ConsoleFormats } from "@anion155/shared/misc";

export enum LogLevels {
  error = 0,
  warn = 1,
  info = 2,
  log = 3,
  debug = 4,
}
// type LoggerColor = ConsoleFormatForegroundColors | ConsoleFormat4bForegroundColorNames | ConsoleFormat4bNodeCompatColorNames;
export type LogLevelNames = keyof Omit<typeof LogLevels, never>;
export type LoggerSink = { [Level in LogLevelNames]: (message: string, ...rest: unknown[]) => void };
export type LoggerStyles = { [Level in LogLevelNames]: ConsoleFormats };
export class Logger {
  #name: string;
  get name() {
    return this.#name;
  }

  #level?: LogLevels;
  get level() {
    return this.#level;
  }
  set level(next: LogLevels | undefined) {
    this.#level = next;
  }
  getNestedLevel() {
    let level = this.#level;
    for (const logger of this.parents()) {
      if (level === undefined || (logger.#level !== undefined && level > logger.#level)) {
        level = logger.#level;
      }
    }
    return level;
  }
  // static getEnvironmentLevel() {}

  #parent?: Logger;
  get parent() {
    return this.#parent;
  }
  *parents() {
    let logger: Logger | undefined = this;
    while (logger?.parent) {
      yield logger.parent;
      logger = logger.parent;
    }
  }

  #sink?: LoggerSink;
  get sink() {
    if (this.#sink) return this.#sink;
    const parentWithSink = this.parents().find((logger) => logger.#sink);
    if (!parentWithSink) return undefined;
    return parentWithSink.#sink;
  }

  #styles?: LoggerStyles;
  getLogLevelStyle(logLevel: LogLevels) {
    const levelName = LogLevels[logLevel] as LogLevelNames;
    let style = this.#styles?.[levelName];
    if (style !== undefined) return style;
    for (const parent of this.parents()) {
      style = parent.#styles?.[levelName];
      if (style !== undefined) return style;
    }
    return Logger.defaultStyles[levelName];
  }
  static defaultStyles: Readonly<LoggerStyles> = {
    error: ["bgRed", "white"],
    warn: "fgYellow",
    info: "green",
    log: "gray",
    debug: "fgGray",
  };

  constructor(
    name: string,
    { level, parent, sink = console, styles }: { level?: LogLevels; parent?: Logger; sink?: LoggerSink; styles?: LoggerStyles } = {},
  ) {
    this.#name = name;
    this.#level = level;
    this.#parent = parent;
    this.#sink = sink;
    this.#styles = styles;
  }
  nested(name: string, level?: LogLevels) {
    return new Logger(name, { level, parent: this, sink: undefined });
  }

  /**
   * should handle:
   * - incode settings
   * - environment settings
   */
  get(
    level: LogLevels,
    { formats = this.getLogLevelStyle(level), header = true }: { formats?: ConsoleFormats; header?: boolean } = {},
  ): { (message: string, ...rest: unknown[]): void } | undefined {
    const levelName = LogLevels[level] as LogLevelNames;
    const nestedLevel = this.getNestedLevel();
    if (nestedLevel !== undefined && level > nestedLevel) return undefined;
    const sink = this.sink;
    if (!sink) return undefined;
    if (!hasTypedField(sink, levelName, "function")) return undefined;
    return (message, ...rest) => {
      if (header) {
        const names = [this.#name, ...this.parents().map((logger) => logger.#name)];
        names.reverse();
        message = applyConsoleFormat("gray", `[${names.join("][")}]`) + " " + message;
      }
      if (formats) message = applyConsoleFormat(formats, message);
      sink[levelName](message, ...rest);
    };
  }
  get error() {
    return this.get(LogLevels.error);
  }
  get warn() {
    return this.get(LogLevels.warn);
  }
  get info() {
    return this.get(LogLevels.info);
  }
  get log() {
    return this.get(LogLevels.log);
  }
  get debug() {
    return this.get(LogLevels.debug);
  }
}
