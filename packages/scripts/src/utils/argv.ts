import { doRun } from "@anion155/shared/do";
import { createErrorClass, DeveloperError, TODO } from "@anion155/shared/errors";

export const ARGV = process.argv.slice();
export const __interpretator = ARGV.shift();
export const __scriptName = ARGV.shift();

export type ArgvParserHelpStyle = {
  indent?: string;
  width?: number | `${number}%`;
  maxWidth?: number;
  formatted?: boolean;
};
const normalizeParserStyles = (style: ArgvParserHelpStyle | undefined) => {
  const indent = style?.indent ?? "";
  let width;
  if (typeof style?.width === "string") {
    width = (process.stdout.columns * parseInt(style.width)) / 100;
  } else if (style?.width) {
    width = style.width;
  } else {
    width = process.stdout.columns;
  }
  if (style?.maxWidth) {
    width = Math.min(width, style?.maxWidth);
  }
  const formatted = style?.formatted ?? true;
  return { indent, width, formatted };
};
export abstract class ArgvParser<Results extends unknown[] = []> {
  abstract clone(): this;
  abstract parse(argv?: string[]): Results;
  abstract help(style?: ArgvParserHelpStyle): string;
}

class NoopParser extends ArgvParser<[]> {
  clone(): this {
    return this;
  }
  parse(argv?: string[]): [] {
    return [];
  }
  help(style?: ArgvParserHelpStyle): string {
    return "";
  }
}
export const noopParser = new NoopParser();

type OptionUsage = `-${string}` | `--${string}` | `-`;
type OptionValueParser<T = string, R extends unknown[] = unknown[]> = (
  value: string,
  results: Partial<R>,
  parser: OptionsParser<R>,
  usage: OptionUsage,
) => T;
type OptionName<T = string> = { usage: OptionUsage; value?: T };
type Option<T = string, R extends unknown[] = unknown[]> = {
  usage: OptionUsage;
  value?: T;
  default?: T;
  aliases?: OptionName<T>[];
  parser?:
    | OptionValueParser<T, R>
    | { type: "enum"; values: T[] }
    | { type: "break"; handler: OptionValueParser<void, R> }
    | { type: "help"; style?: OptionParserHelpStyle };
  description?: string;
  required?: boolean | string;
};
type LastResult<Results extends any[]> = Results extends [...any[], infer Value] ? Value | OptionValueParser<Value, Results> : never;
type LastDefault<Results extends any[]> = Results extends [...any[], infer Value] ? Exclude<Value, undefined> : never;
type LastWithDefault<Results extends any[]> = Results extends [...infer Rest, infer Value]
  ? OptionsParser<[...Rest, Exclude<Value, undefined>]>
  : never;

export type OptionsParserConfig = {
  "oneArgValue:--arg=value"?: boolean;
  "flagValues:--arg=y|n"?: boolean;
  "booleanNo:--no-arg"?: boolean;
  "ignorable:--/arg"?: boolean;
} & (
  | {
      "short:-a"?: "disabled";
    }
  | {
      "short:-a": "group:-abcd";
    }
  | {
      "short:-a": "sameAsLong:-arg";
      "defaultShort:-arg"?: boolean;
      "autoShort:-arg"?: boolean;
    }
  | {
      "short:-a": "value:-a<value>";
      "defaultShort:-arg"?: boolean;
      "autoShort:-arg"?: boolean;
    }
);
export type OptionParserHelpStyle = ArgvParserHelpStyle & {
  optionsHeader?: string;
};

const POSSIBLE_TRUE_VALUES = ["true", "t", "yes", "y"];
const POSSIBLE_FALSE_VALUES = ["false", "f", "no", "n"];
const parseBooleanValue: OptionValueParser<boolean> = (value, _results, parser, usage) => {
  if (typeof value === "boolean") return value;
  if (POSSIBLE_TRUE_VALUES.includes(value)) return true;
  else if (POSSIBLE_FALSE_VALUES.includes(value)) return false;
  throw new InvalidOptionError(parser, usage);
};

export class OptionsParser<Results extends unknown[] = []> extends ArgvParser<Results> {
  constructor(config?: OptionsParserConfig, style?: OptionParserHelpStyle) {
    super();
    this.#config = Object.freeze({
      "oneArgValue:--arg=value": true,
      "flagValues:--arg=y|n": true,
      "booleanNo:--no-arg": true,
      "ignorable:--/arg": true,
      "short:-a": "disabled",
      ...config,
    } as UnionHelpers_Required<OptionsParserConfig>);
    this.#style = style;
  }

  clone(): this {
    const cloned = new OptionsParser<Results>();
    cloned.#config = this.#config;
    cloned.#options = this.#options.slice();
    cloned.#style = this.#style && { ...this.#style };
    cloned.#helpSource = this.#helpSource;
    cloned.#helpSink = this.#helpSink;
    return cloned as never;
  }

  #config: UnionHelpers_Required<OptionsParserConfig>;

  #style: OptionParserHelpStyle | undefined;
  modifyStyle(modify: (current: OptionParserHelpStyle | undefined) => OptionParserHelpStyle | undefined) {
    this.#style = modify(this.#style);
    return this;
  }

  #options: Option<any, Results>[] = [];
  resultsSize() {
    return this.#options.length;
  }

  #autoAlias(usage: OptionUsage, option: Option<any, Results>, value: unknown = option.value) {
    const aliases = (option.aliases ??= []);
    // if (type === "flag" && this.#config["booleanNo:--no-arg"]) {
    //   if (usage[1] === "-") {
    //     aliases.push({ usage: `--no-${usage.substring(2)}`, value: !value });
    //   } else {
    //     aliases.push({ usage: `-no-${usage.substring(1)}`, value: !value });
    //   }
    // }
    if (usage[1] === "-" && this.#config["short:-a"] === "sameAsLong:-arg" && this.#config["autoShort:-arg"]) {
      aliases.push({ usage: usage.substring(1, 3) as never });
    }
    return aliases;
  }
  option<Value>(option: Option<Value, Results>): OptionsParser<[...Results, Value | undefined]> {
    option.aliases = this.#autoAlias(option.usage, option);
    this.#options.push(option);
    return this as never;
  }
  optionFlag(usage: OptionUsage, value?: boolean) {
    const parser = this.#config["flagValues:--arg=y|n"] ? parseBooleanValue : undefined;
    return this.option<boolean>({ usage, value, parser });
  }
  optionValue(usage: OptionUsage, value?: string): OptionsParser<[...Results, string | undefined]> {
    return this.option<string>({ usage, value });
  }
  optionBreak(usage: OptionUsage, handler: OptionValueParser<void, Results>) {
    return this.option<boolean | undefined>({ usage, parser: { type: "break", handler }, value: true as never });
  }
  optionEnum<Values extends string[]>(usage: OptionUsage, ...values: Values): OptionsParser<[...Results, Values[number] | undefined]> {
    return this.option<Values[number]>({ usage, parser: { type: "enum", values } });
  }

  #helpSource: ArgvParser<any> | { (): ArgvParser<any> } | null = null;
  setHelpSource(helpSource: ArgvParser<any> | { (): ArgvParser<any> }): OptionsParser<Results> {
    this.#helpSource = helpSource;
    return this;
  }
  #helpSink: { (help: string): void } | null = null;
  setHelpSink(helpSink: { (help: string): void }): OptionsParser<Results> {
    this.#helpSink = helpSink;
    return this;
  }
  optionHelp(style?: OptionParserHelpStyle) {
    return this.option<boolean | undefined>({
      usage: "--help",
      description: "Print this help message",
      parser: { type: "help", style },
      value: true as never,
    });
  }

  alias(usage: OptionUsage, value?: LastResult<Results>) {
    const option = this.#options.at(-1)!;
    const aliases = (option.aliases ??= []);
    aliases.push({ usage, value });
    this.#autoAlias(usage, option, value);
    return this;
  }
  addDescription(description: string) {
    this.#options.at(-1)!.description = description;
    return this;
  }
  withDefault(value: LastDefault<Results>): LastWithDefault<Results> {
    Object.assign(this.#options.at(-1)!, { default: value });
    return this as never;
  }
  required(errorMessage?: string): LastWithDefault<Results> {
    this.#options.at(-1)!.required = errorMessage ?? true;
    return this as never;
  }

  parse(argv: string[] = ARGV.slice()): Results {
    const items = this.#options.reduce<Map<string, [OptionName<any>, Option<any, Results>, index: number]>>((map, option, index) => {
      map.set(option.usage, [option, option, index]);
      option.aliases?.forEach(({ usage, value }) => {
        map.set(usage, [{ usage, value: value ?? option.value }, option, index]);
      });
      return map;
    }, new Map());
    if (!items.size) return [] as never;
    const values: Results = new Array(this.#options.length) as never;
    this.#options.forEach((option, index) => {
      if ("default" in option && option.default !== undefined) values[index] = option.default as never;
    });
    const handleOneArgValue = (arg: string) => {
      let usage, value;
      if (this.#config["oneArgValue:--arg=value"]) {
        const index = arg.indexOf("=");
        if (index >= 0) {
          value = arg.substring(index + 1);
          usage = arg.substring(0, index);
        } else {
          usage = arg;
        }
      } else {
        usage = arg;
      }
      return [usage, value] as const;
    };
    while (true) {
      let arg = argv[0];
      if (!arg || arg.length < 2 || arg[0] !== "-") break;
      if (arg === "--") break;
      argv.shift();
      let usage, value;
      if (arg[1] !== "-") {
        if (this.#config["short:-a"] === "disabled") {
          throw new InvalidOptionError(this, arg);
        } else if (this.#config["short:-a"] === "sameAsLong:-arg") {
          [usage, value] = handleOneArgValue(arg);
        } else if (this.#config["short:-a"] === "value:-a<value>") {
          value = arg.substring(2);
          usage = arg.substring(0, 2);
        } else if (this.#config["short:-a"] === "group:-abcd") {
          TODO("group:-abcd");
        } else {
          throw new DeveloperError("invalid OptionsParser configuration");
        }
        arg = usage.substring(1);
      } else {
        [usage, value] = handleOneArgValue(arg);
        arg = usage.substring(2);
      }
      if (value === undefined && typeof argv[0] === "string" && argv[0][0] !== "-") {
        value = argv.shift()!;
      }
      let ignore = false;
      if (this.#config["ignorable:--/arg"] && arg.startsWith("/") && arg.length > 1) {
        arg = arg.substring(1);
        ignore = true;
      }
      const item = items.get(usage);
      if (item === undefined) throw new InvalidOptionError(this, usage);
      if (typeof item[0].value === "function") {
        value = item[0].value(value);
      } else if (item[0].value !== undefined) {
        value = item[0].value;
      }
      if (ignore) continue;
      values[item[2]] = value as never;
    }
    this.#options.forEach((option, index) => {
      if (values[index] === undefined) return;
      if (typeof option.parser === "function") {
        values[index] = option.parser(values[index] as never, values, this, option.usage);
      } else if (option.parser?.type === "enum") {
        if (!option.parser.values.includes(values[index])) {
          throw new InvalidOptionError(this, option.usage);
        }
      } else if (option.parser?.type === "break") {
        option.parser.handler(values[index] as never, values, this, option.usage);
        throw new OptionParserBreak();
      } else if (option.parser?.type === "help") {
        const sink = this.#helpSink ?? console.log;
        let source = this.#helpSource ?? this;
        if (typeof source === "function") source = source();
        sink(source.help(option.parser.style));
        throw new OptionParserBreak();
      }
    });
    this.#options.forEach((option, index) => {
      if (option.required && values[index] === undefined) {
        let message = undefined;
        if (typeof option.required === "string") {
          message = option.required;
        }
        throw new RequiredOptionError(this, option.usage, message);
      }
    });
    return values;
  }

  #getStyle(style?: OptionParserHelpStyle) {
    return this.#style && style ? { ...this.#style, ...style } : this.#style || style;
  }

  // usage(name?: string, style?: OptionParserHelpStyle) {
  //   const { formatted } = normalizeParserStyles(this.#getStyle(style));
  //   let options = "[options]";
  //   const requires = this.#options.filter((option) => option.required);
  //   if (requires.length) {
  //     const booleanValues = this.#config["booleanValues:--arg=y|n"] && "short";
  //     options += requires
  //       .map((option) => {
  //         let values: string[] | undefined;
  //         if (option.type === "string") values = ["value"];
  //         else if (option.type === "enum") values = option.values.map(String);
  //         else if (option.type === "boolean") {
  //           if (this.#config["booleanValues:--arg=y|n"]) values = POSSIBLE_BOOLEAN_VALUES;
  //         }
  //         const usages = option.names.reduce((acc, name) => {
  //           if (typeof name === "string") {
  //             if (name.length > 1) {
  //               acc.push(optionUsage(option, { name, short: false }, booleanValues));
  //             } else {
  //               acc.push(optionUsage(option, { name, short: true }, booleanValues));
  //             }
  //           } else {
  //             acc.push(optionUsage(option, name, booleanValues));
  //           }
  //           return acc;
  //         }, [] as string[]);
  //         // if (option.type === "boolean" && this.#config["booleanNo:--no-arg"]) {
  //         //   usages.forEach(usage => usage[1] === '-' ? `--no-${usage.substring(2)}` : `-no-${usage.substring(1)}`);
  //         // }
  //         // return `${prefix}${option.name}${values?.length ? ` <${values.join("|")}>` : ""}`;
  //         return usages;
  //       })
  //       .join(" ");
  //   }
  //   return `${"Usage:".consoleFormat("bold", !formatted)} ${name ?? __scriptName} [options]`;
  // }

  help(style?: OptionParserHelpStyle) {
    if (!this.#options.length) return "";
    let { indent, width, formatted } = normalizeParserStyles(this.#getStyle(style));
    let str = "";
    if (style?.optionsHeader) {
      str += `${indent}${`${style?.optionsHeader}:`.consoleFormat("bold", !formatted)}\n`;
      indent += "  ";
    }
    const printName = (name: OptionName<any>) => {
      let str = name.usage;
      if (typeof name.value !== "function" && name.value !== undefined) {
        str += ` (value: ${JSON.stringify(name.value)})`;
      }
      return str;
    };
    const namesLiness = this.#options.map((option) => {
      const lines = [] as string[];
      lines.push(printName(option));
      option.aliases?.forEach((name) => lines.push(printName(name)));
      return lines.join(",\n") + "\n";
    });
    const namesWidth = Math.clamp(10, Math.max(...namesLiness.map((line) => line.length)), Math.trunc((width - indent.length) / 3));
    const descriptionWidth = width - indent.length - namesWidth - 1;
    this.#options.forEach((option, index) => {
      const namesLines = namesLiness[index].wrap(namesWidth, true);
      const descriptionLines = doRun(() => {
        let description = option.description ?? "";
        if (typeof option.parser === "object" && option.parser?.type === "enum") {
          description += `\n${`Possible values: ${option.parser.values.join(" | ")}`.consoleFormat(["bold", "fgGreen"], !formatted)}`;
        }
        if (option.required) description += `\n${"required".consoleFormat(["bold", "fgYellow"], !formatted)}`;
        if (option.default) description += `\n${`default: ${option.default}`.consoleFormat("fgYellow", !formatted)}`;
        return description;
      }).wrap(descriptionWidth);
      str += Array.from({ length: Math.max(namesLines.length, descriptionLines.length) }, (_, i) => {
        const nameLine = (namesLines[i] ?? "").padEnd(namesWidth, " ");
        const descriptionLine = (descriptionLines[i] ?? "").padEnd(descriptionWidth, " ");
        return `${indent}${nameLine} ${descriptionLine}\n`;
      }).join("");
    });
    return str;
  }
}
export function optionsParser(config?: OptionsParserConfig, style?: OptionParserHelpStyle) {
  return new OptionsParser(config, style);
}

export abstract class UsageError extends createErrorClass("UsageError") {
  abstract help(style?: OptionParserHelpStyle): string;
}

export class InvalidOptionError extends UsageError {
  constructor(
    readonly parser: OptionsParser<any>,
    readonly option?: string,
    message?: string,
  ) {
    super(message ?? (option ? `invalid option: ${option}` : "invalid option"));
  }

  help(style?: OptionParserHelpStyle): string {
    return this.parser.help(style);
  }
}

export class RequiredOptionError extends UsageError {
  constructor(
    readonly parser: OptionsParser<any>,
    readonly option?: string,
    message?: string,
  ) {
    super(message ?? (option ? `required option: ${option}` : "required option"));
  }

  help(style?: OptionParserHelpStyle): string {
    return this.parser.help(style);
  }
}

export class OptionParserBreak extends createErrorClass("OptionParserBreak", "break option invoked") {}

export type CommandsParserHelpStyle = ArgvParserHelpStyle & {
  printHelpSubcommands?: boolean;
  optionsHeader?: string;
  commandsHeader?: string;
};

type CommandResults<OptionsResults extends unknown[], Command extends PropertyKey, Parser extends ArgvParser<unknown[]>> = [
  ...OptionsResults,
  Command,
  ...ReturnType<Parser["parse"]>,
];
declare const handled: unique symbol;
type handled = typeof handled;
type CommandResultsHandled<
  OptionsResults extends unknown[],
  Command extends PropertyKey,
  Parser extends ArgvParser<unknown[]> & { [handled]?: true },
> = Parser extends { [handled]: true } ? never : CommandResults<OptionsResults, Command, Parser>;
type CommandsParserResults<OptionsResults extends unknown[], Commands extends Record<string, ArgvParser<unknown[]> & { [handled]?: true }>> =
  | { [Command in keyof Commands]: CommandResultsHandled<OptionsResults, Command, Commands[Command]> }[keyof Commands]
  | [...OptionsResults, undefined];

export class CommandsParser<
  OptionsResults extends unknown[] = [],
  Commands extends Record<string, ArgvParser<unknown[]> & { [handled]?: true }> = {},
  LastCommand extends string = never,
> extends ArgvParser<CommandsParserResults<OptionsResults, Commands>> {
  constructor(options?: OptionsParser<OptionsResults>, style?: CommandsParserHelpStyle) {
    super();
    this.#options = options ?? (noopParser as never);
    this.#style = style;
  }

  clone() {
    const cloned = new CommandsParser<OptionsResults, Commands>();
    cloned.#style = cloned.#style && { ...cloned.#style };
    cloned.#options = this.#options.clone();
    cloned.#commands = new Map(this.#commands.entries().map(([command, { parser, ...rest }]) => [command, { ...rest, parser: parser.clone() }]));
    return cloned as never;
  }

  #style: CommandsParserHelpStyle | undefined;
  modifyStyle(modify: (current: CommandsParserHelpStyle | undefined) => CommandsParserHelpStyle | undefined) {
    this.#style = modify(this.#style);
    return this;
  }

  #options: OptionsParser<OptionsResults>;
  modifyOptions<Results extends unknown[]>(
    modifier: (current: OptionsParser<OptionsResults>) => OptionsParser<Results>,
  ): CommandsParser<Results, Commands> {
    this.#options = modifier(this.#options) as never;
    return this as never;
  }

  #commands = new Map<
    keyof Commands,
    {
      parser: ArgvParser<unknown[]>;
      description?: string;
      handler?: (options: OptionsResults, command: keyof Commands, commandResults: unknown[]) => void;
    }
  >();
  #lastCommand: keyof Commands | undefined;
  commands() {
    return this.#commands.keys().toArray();
  }

  modifyParser<Command extends keyof Commands>(command: Command) {
    return <Parser extends Commands[Command]>(
      modifier: (current: Commands[Command]) => Parser,
    ): CommandsParser<OptionsResults, Omit<Commands, Command> & { [command in Command]: Parser }> => {
      const stored = this.#commands.get(command);
      if (!stored) return undefined as never;
      stored.parser = modifier(stored.parser as never);
      return this as never;
    };
  }

  addCommand<Command extends string>(command: Command): CommandsParser<OptionsResults, Commands & { [command in Command]: NoopParser }, Command>;
  addCommand<Command extends string, Parser extends ArgvParser<unknown[]>>(
    command: Command,
    parser: Parser,
  ): CommandsParser<OptionsResults, Commands & { [command in Command]: Parser }, Command>;
  addCommand(command: string, parser: ArgvParser<unknown[]> = noopParser) {
    this.#commands.set(command, { parser });
    this.#lastCommand = command;
    return this as never;
  }
  addHelp(description: string = "Print commands help") {
    type HelpParser = CommandsParser<[], { [Command in keyof Commands]: NoopParser }>;
    const parser = this.#commands.entries().reduce<CommandsParser>((parser, [command, {}]) => {
      return parser.addCommand(command as never).addDescription(`Print help message for '${String(command)}' command`);
    }, new CommandsParser());
    return this.addCommand("help", parser as never as HelpParser)
      .addDescription(description)
      .handleCommand(([command], options, helpCommand) => {
        if (helpCommand !== "help") throw new DeveloperError("options setup messed up, command should be always on same place in results");
        if (command === undefined) console.log(this.help());
        else if (!this.#commands.has(command as never)) throw new UnknownCommandError(this, command as never);
        else console.log(this.helpCommand(command as never));
      });
  }

  addDescription(description: string) {
    if (!this.#lastCommand) throw new DeveloperError("should be called after addCommand()");
    this.#commands.get(this.#lastCommand)!.description = description;
    return this;
  }
  handleCommand(
    handler: (commandResults: ReturnType<Commands[LastCommand]["parse"]>, generalResults: OptionsResults, command: LastCommand) => void,
  ): CommandsParser<OptionsResults, Omit<Commands, LastCommand> & { [command in LastCommand]: Commands[LastCommand] & { [handled]: true } }> {
    if (!this.#lastCommand) throw new DeveloperError("should be called after addCommand()");
    this.#commands.get(this.#lastCommand)!.handler = handler as never;
    return this as never;
  }

  parse(argv: string[] = ARGV.slice()): CommandsParserResults<OptionsResults, Commands> {
    try {
      const options = this.#options.parse(argv);
      const command = argv.shift();
      if (!command) return [...options, undefined];
      const stored = this.#commands.get(command as never);
      if (!stored) throw new UnknownCommandError(this, command);
      try {
        const commandOptions = stored.parser.parse(argv);
        if (stored.handler) {
          stored.handler(options, command, commandOptions);
          throw new CommandParserBreak();
        }
        return [...options, command, ...commandOptions] as never;
      } catch (error) {
        if (error instanceof UnknownCommandError) throw new CommandNestedError(this, command, error);
        if (error instanceof GeneralOptionsError) throw new CommandNestedError(this, command, error);
        if (error instanceof CommandNestedError) throw new CommandNestedError(this, command, error);
        if (error instanceof CommandNestedError) throw new CommandNestedError(this, command, error);
        if (error instanceof InvalidOptionError) throw new CommandNestedError(this, command, error);
        throw error;
      }
    } catch (error) {
      if (error instanceof InvalidOptionError) throw new GeneralOptionsError(this, error);
      throw error;
    }
  }

  #getStyle(style: CommandsParserHelpStyle | undefined) {
    return this.#style && style ? { ...this.#style, ...style } : this.#style || style;
  }
  helpOptions(style?: CommandsParserHelpStyle) {
    style = this.#getStyle(style);
    return this.#options.help({ ...style, optionsHeader: style?.optionsHeader ?? "GENERAL OPTIONS" });
  }
  helpCommand(command: keyof Commands, style?: CommandsParserHelpStyle, namesWidth?: number) {
    command = String(command);
    style = this.#getStyle(style);
    const { indent, width, formatted } = normalizeParserStyles(style);
    const printHelpSubcommands = style?.printHelpSubcommands ?? false;
    if (namesWidth === undefined) {
      namesWidth = Math.clamp(10, command.length, Math.trunc((width - indent.length) / 4));
    }
    const stored = this.#commands.get(command);
    if (!stored) return "";
    const nameLines = command.wrap(namesWidth);
    const descriptionWidth = width - indent.length - namesWidth - 1;
    const descriptionLines = (stored.description ?? "").wrap(descriptionWidth);
    let str = "";
    str += Array.from({ length: Math.max(nameLines.length, descriptionLines.length) }, (_, i) => {
      const nameLine = (nameLines[i] ?? "").padEnd(namesWidth, " ");
      const descriptionLine = (descriptionLines[i] ?? "").padEnd(descriptionWidth, " ");
      return `${indent}${nameLine.consoleFormat("bold", !formatted)} ${descriptionLine}\n`;
    }).join("");
    // TODO: print command usage
    if (command === "help" && !printHelpSubcommands) {
    } else {
      str += stored.parser.help({
        indent: indent + "  ",
        width,
        formatted,
        optionsHeader: `${command.toUpperCase()} ${style?.optionsHeader ?? "OPTIONS"}`,
        commandsHeader: `${command.toUpperCase()} ${style?.commandsHeader ?? "SUBCOMMANDS"}`,
      } as CommandsParserHelpStyle | OptionParserHelpStyle);
    }
    return str;
  }
  helpCommands(style?: CommandsParserHelpStyle) {
    style = this.#getStyle(style);
    const { indent, width, formatted } = normalizeParserStyles(style);
    const header = style?.commandsHeader ?? "COMMANDS";
    const namesWidth = Math.clamp(
      10,
      Math.max(...this.#commands.keys().map((command) => String(command).length)),
      Math.trunc((width - indent.length) / 4),
    );
    const commandsStyle: CommandsParserHelpStyle = { indent: indent + "  ", width, formatted };
    let commands = this.#commands.keys().reduce<string>((str, command) => {
      str += this.helpCommand(command, commandsStyle, namesWidth);
      return str;
    }, "");
    if (commands && header) commands = `${indent}${`${header}:`.consoleFormat("bold", !formatted)}\n${commands}`;
    return commands;
  }
  help(style?: CommandsParserHelpStyle) {
    return [this.helpOptions(style), this.helpCommands(style)].filter(Boolean).join("");
  }
}
export function commandsParser<OptionsResults extends unknown[] = []>(options?: OptionsParser<OptionsResults>, style?: CommandsParserHelpStyle) {
  return new CommandsParser(options, style);
}

export class UnknownCommandError extends UsageError {
  constructor(
    readonly parser: CommandsParser<any, any, any>,
    readonly command?: string,
    message?: string,
  ) {
    super(message ?? (command ? `unknown command: ${command}` : "unknown command"));
  }
  help(style?: CommandsParserHelpStyle) {
    return this.parser.helpCommands(style);
  }
}

export class GeneralOptionsError extends UsageError {
  constructor(
    readonly parser: CommandsParser<any, any, any>,
    readonly optionError: InvalidOptionError,
  ) {
    super(optionError.message);
  }

  help(style?: CommandsParserHelpStyle) {
    return this.parser.helpOptions(style);
  }
}

export class CommandNestedError extends UsageError {
  constructor(
    readonly parser: CommandsParser<any, any, any>,
    readonly command: string,
    readonly cause: UsageError,
  ) {
    super(`invalid command: ${command}: ${cause.message}`);
  }

  help(style?: CommandsParserHelpStyle) {
    return this.parser.helpCommand(this.command, { printHelpSubcommands: true, ...style });
  }
}

export class CommandParserBreak extends createErrorClass("CommandParserBreak", "command handled") {}
