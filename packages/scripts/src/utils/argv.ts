import { doRun } from "@anion155/shared/do";
import { createErrorClass, DeveloperError } from "@anion155/shared/errors";
import { Curried, curryHelper } from "@anion155/shared/functional";

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

type OptionNames = Array<string | { name: string; short?: boolean }>;
type BaseOption<Type extends string, T = string> = { type: Type; default?: T; names: OptionNames; description?: string };

type StringOption = BaseOption<"string">;
type BooleanOption = BaseOption<"boolean", boolean>;
type EnumOption<Values extends unknown[]> = BaseOption<"enum", Values[number]> & { values: Values };
type BreakOption<Results> = Omit<BaseOption<"break">, "default"> & { handler: (results: Results) => void };

type Option = StringOption | BooleanOption | EnumOption<unknown[]> | BreakOption<any>;
type OptionParams<_Option extends Option> = Omit<PartialSome<_Option, "names">, "type">;
type OptionParamsD<_Option extends Option> = RequiredSome<OptionParams<_Option>, Extract<"default", keyof OptionParams<_Option>>>;

export type OptionsParserConfig = {
  "short:-a"?: boolean;
  "oneArgValue:--arg=value"?: boolean;
  "booleanValues:--arg=y|n"?: boolean;
  "booleanNo:--no-arg"?: boolean;
  "ignorable:--/arg"?: boolean;
} & (
  | {
      "shortBolleanGroups:-abcd"?: true;
      "longOneHyphen:-arg"?: never;
    }
  | {
      "shortBolleanGroups:-abcd": false;
      "longOneHyphen:-arg"?: boolean;
    }
);
export type OptionParserHelpStyle = ArgvParserHelpStyle & {
  optionsHeader?: string;
};

const POSSIBLE_TRUE_VALUES = ["true", "t", "yes", "y"];
const POSSIBLE_FALSE_VALUES = ["false", "f", "no", "n"];
const POSSIBLE_BOOLEAN_VALUES = [...POSSIBLE_TRUE_VALUES, ...POSSIBLE_FALSE_VALUES];

export class OptionsParser<Results extends unknown[] = []> extends ArgvParser<Results> {
  constructor(config?: OptionsParserConfig, style?: OptionParserHelpStyle) {
    super();
    this.#config = Object.freeze({
      "short:-a": config?.["short:-a"] ?? true,
      "oneArgValue:--arg=value": config?.["oneArgValue:--arg=value"] ?? true,
      "booleanValues:--arg=y|n": config?.["booleanValues:--arg=y|n"] ?? true,
      "booleanNo:--no-arg": config?.["booleanNo:--no-arg"] ?? true,
      "ignorable:--/arg": config?.["ignorable:--/arg"] ?? true,
      "shortBolleanGroups:-abcd": config?.["shortBolleanGroups:-abcd"] ?? true,
      "longOneHyphen:-arg": config?.["longOneHyphen:-arg"] ?? false,
    }) as never;
    this.#style = style;
  }

  clone(): this {
    const cloned = new OptionsParser<Results>();
    cloned.#config = this.#config;
    cloned.#style = this.#style && { ...this.#style };
    cloned.#options = this.#options.slice();
    cloned.#helpHandler = this.#helpHandler;
    return cloned as never;
  }

  #config: UnionHelpers_Required<OptionsParserConfig>;

  #style: OptionParserHelpStyle | undefined;
  modifyStyle(modify: (current: OptionParserHelpStyle | undefined) => OptionParserHelpStyle | undefined) {
    this.#style = modify(this.#style);
    return this;
  }

  #options: Option[] = [];
  resultsSize() {
    return this.#options.length;
  }
  addOption(option: Option): this {
    this.#options.push(option);
    return this as never;
  }

  addString(name: string, option: OptionParamsD<StringOption>): OptionsParser<[...Results, string]>;
  addString(name: string, option?: OptionParams<StringOption> | string): OptionsParser<[...Results, string | undefined]>;
  addString(name: string, option?: OptionParams<StringOption> | string) {
    if (typeof option === "string") option = { description: option };
    return this.addOption({ ...option, type: "string", names: [name, ...(option?.names ?? [])] }) as never;
  }

  addBoolean(name: string, option: OptionParamsD<BooleanOption>): OptionsParser<[...Results, boolean]>;
  addBoolean(name: string, option?: OptionParams<BooleanOption> | string): OptionsParser<[...Results, boolean | undefined]>;
  addBoolean(name: string, option?: OptionParams<BooleanOption> | string) {
    if (typeof option === "string") option = { description: option };
    return this.addOption({ ...option, type: "boolean", names: [name, ...(option?.names ?? [])] }) as never;
  }

  addEnum<Values extends string[]>(
    ...values: Values
  ): Curried<{
    (name: string, option: Omit<OptionParamsD<EnumOption<Values>>, "values">): OptionsParser<[...Results, Values[number]]>;
    (name: string, option?: Omit<OptionParams<EnumOption<Values>>, "values"> | string): OptionsParser<[...Results, Values[number] | undefined]>;
  }> {
    return curryHelper((name: string, option?: Omit<OptionParams<EnumOption<Values>>, "values"> | string) => {
      if (typeof option === "string") option = { description: option };
      return this.addOption({ ...option, type: "enum", names: [name, ...(option?.names ?? [])], values });
    }) as never;
  }

  addBreak(handler: BreakOption<Results>["handler"]) {
    return (name: string, option?: Omit<OptionParams<BreakOption<Results>>, "handler"> | string): OptionsParser<[...Results, never]> => {
      if (typeof option === "string") option = { description: option };
      return this.addOption({ ...option, type: "break", names: [name, ...(option?.names ?? [])], handler }) as never;
    };
  }

  #helpHandler?: (help: string) => void;
  setHelpHandler(handler: (help: string) => void) {
    this.#helpHandler = handler;
    return this;
  }
  addHelp(description: string = "Print this message", style?: OptionParserHelpStyle) {
    return this.addBreak(() => {
      const help = this.help(style);
      const handler = this.#helpHandler ?? console.log;
      handler(help);
    })("help", { description });
  }

  parse(argv: string[] = ARGV): Results {
    type OptionItem = UnionHelpers_Intersect<
      UnionHelpers_Omit<Option, "names">,
      {
        short: boolean;
        name: string;
        index: number;
      }
    >;
    const optionUsage = (option: OptionItem) => {
      const prefix = option.short ? "-" : "--";
      let values: string[] | undefined;
      if (option.type === "string") values = ["value"];
      else if (option.type === "enum") values = option.values.map(String);
      else if (option.type === "boolean") {
        if (this.#config["booleanValues:--arg=y|n"]) values = POSSIBLE_BOOLEAN_VALUES;
      }
      return `${prefix}${option.name}${values?.length ? ` <${values.join("|")}>` : ""}`;
    };
    const options = this.#options.reduce<Map<string, OptionItem>>((map, option, index) => {
      option.names.forEach((item) => {
        const { name, short } = typeof item === "string" ? { name: item } : item;
        if (short !== undefined) {
          map.set(name, { ...option, index, short, name });
        } else if (name.length === 1) {
          map.set(name, { ...option, index, short: true, name });
        } else {
          map.set(name, { ...option, index, short: false, name });
          if (this.#config["short:-a"]) {
            if (!map.has(name[0])) map.set(name[0], { ...option, index, short: true, name });
          }
        }
      });
      return map;
    }, new Map());
    if (!options.size) return [] as never;
    const values: Results = new Array(this.#options.length) as never;
    this.#options.forEach((option, index) => {
      if ("default" in option && option.default !== undefined) values[index] = option.default as never;
    });
    while (true) {
      let arg = argv[0];
      if (!arg || arg.length < 2 || arg[0] !== "-") break;
      if (arg === "--") break;
      argv.shift();
      let short, name, value;
      if (arg[1] !== "-") {
        short = true;
        arg = arg.substring(1);
        if (arg.length > 1) {
          if (this.#config["shortBolleanGroups:-abcd"]) {
            // ("-abcd");
            argv.unshift(...arg.split("").map((o) => `-${o}`));
            continue;
          }
          if (this.#config["longOneHyphen:-arg"]) {
            argv.unshift(`--${arg}`);
            continue;
          }
          throw new InvalidOptionError(this, `-${arg}`);
        }
      } else {
        short = false;
        arg = arg.substring(2);
      }
      let ignore = false;
      if (this.#config["ignorable:--/arg"] && arg.startsWith("/") && arg.length > 1) {
        // ("--/arg");
        arg = arg.substring(1);
        ignore = true;
      }
      if (this.#config["booleanNo:--no-arg"] && arg.startsWith("no-") && arg.length > 3) {
        // ("--no-arg");
        arg = arg.substring(3);
        value = false;
      }
      if (this.#config["oneArgValue:--arg=value"]) {
        // ("--arg=value");
        const index = arg.indexOf("=");
        if (index > 0) {
          name = arg.substring(0, index);
          value = arg.substring(index + 1);
        }
      }
      if (name === undefined) name = arg;
      const option = options.get(name);
      if (option === undefined || option.short !== short) throw new InvalidOptionError(this, `${short ? "-" : "--"}${name}`);
      if (option.type === "boolean") {
        if (value === undefined) value = true;
        else if (this.#config["booleanValues:--arg=y|n"]) {
          value = value.toString().toLowerCase();
          if (POSSIBLE_TRUE_VALUES.includes(value)) value = true;
          else if (POSSIBLE_FALSE_VALUES.includes(value)) value = true;
        }
        if (typeof value !== "boolean") throw new InvalidOptionError(this, optionUsage(option));
      } else if (option.type === "string") {
        if (value === undefined) {
          value = argv.shift();
          if (value !== undefined && value.startsWith("-")) throw new InvalidOptionError(this, optionUsage(option));
        }
        if (typeof value !== "string") throw new InvalidOptionError(this, optionUsage(option));
      } else if (option.type === "enum") {
        if (value === undefined) {
          value = argv.shift();
          if (value !== undefined && value.startsWith("-")) throw new InvalidOptionError(this, optionUsage(option));
        }
        if (!option.values.includes(value)) throw new InvalidOptionError(this, optionUsage(option));
      } else if (option.type === "break") {
        if (value !== undefined) throw new InvalidOptionError(this, optionUsage(option));
        option.handler(values);
        throw new OptionParserBreak();
      }
      if (!ignore) values[option.index] = value as never;
    }
    return values;
  }

  help(style?: OptionParserHelpStyle) {
    if (!this.#options.length) return "";
    let { indent, width, formatted } = normalizeParserStyles(this.#style && style ? { ...this.#style, ...style } : this.#style || style);
    let str = "";
    if (style?.optionsHeader) {
      str += `${indent}${`${style?.optionsHeader}:`.consoleFormat("bold", !formatted)}\n`;
      indent += "  ";
    }
    const namesLiness = this.#options.map((option) =>
      option.names.map((name) => (typeof name === "string" || !name.short ? `--${name}` : `-${name}`)).join(",\n"),
    );
    const namesWidth = Math.clamp(10, Math.max(...namesLiness.map((line) => line.length)), Math.trunc((width - indent.length) / 3));
    const descriptionWidth = width - indent.length - namesWidth - 1;
    this.#options.forEach((option, index) => {
      const namesLines = namesLiness[index].wrap(namesWidth, true);
      const descriptionLines = doRun(() => {
        let description = option.description ?? "";
        description += `\n${`type: ${option.type}`.consoleFormat("bold", !formatted)}`;
        let values: string[] | undefined;
        if (option.type === "boolean") {
          if (this.#config["booleanValues:--arg=y|n"]) values = POSSIBLE_BOOLEAN_VALUES;
        } else if (option.type === "enum") {
          values = option.values.map(String);
        }
        if (values) description += `\n${`Possible values: ${values.join(" | ")}`.consoleFormat(["bold", "fgGreen"], !formatted)}`;
        if ("default" in option && option.default) description += `\n${`default: ${option.default}`.consoleFormat(["bold", "fgYellow"], !formatted)}`;
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
    readonly parser: OptionsParser<unknown[]>,
    readonly option?: string,
    message?: string,
  ) {
    super(message ?? (option ? `invalid option: ${option}` : "invalid option"));
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
  modifyCommand<Command extends keyof Commands>(command: Command) {
    return <Parser extends Commands[Command]>(
      modifier: (current: Commands[Command]) => Parser,
    ): CommandsParser<OptionsResults, Omit<Commands, Command> & { [command in Command]: Parser }> => {
      const stored = this.#commands.get(command);
      if (!stored) return undefined as never;
      stored.parser = modifier(stored.parser as never);
      return this as never;
    };
  }
  commands() {
    return this.#commands.keys().toArray();
  }
  addCommand<Command extends string>(
    command: Command,
    description?: string,
  ): Curried<{
    (): CommandsParser<OptionsResults, Commands & { [command in Command]: NoopParser }>;
    <Parser extends ArgvParser<unknown[]>>(parser: Parser): CommandsParser<OptionsResults, Commands & { [command in Command]: Parser }>;
  }> {
    return curryHelper((parser = noopParser) => {
      this.#commands.set(command as never, { parser, description });
      return this as never;
    });
  }
  handleCommand<Command extends keyof Commands>(
    command: Command,
    handler: (options: OptionsResults, command: Command, commandResults: ReturnType<Commands[Command]["parse"]>) => void,
  ): CommandsParser<OptionsResults, Omit<Commands, Command> & { [command in Command]: Commands[Command] & { [handled]: true } }> {
    this.#commands.get(command as never)!.handler = handler as never;
    return this as never;
  }
  addHelp(
    description: string = "Print commands help",
  ): CommandsParser<OptionsResults, Commands & { help: CommandsParser<[], { [Command in keyof Commands]: NoopParser }> & { [handled]: true } }> {
    const parser = this.#commands.entries().reduce<CommandsParser>((parser, [command, {}]) => {
      return parser.addCommand(command as never, `Print help message for '${String(command)}' command`)();
    }, new CommandsParser());
    this.#commands.set("help", {
      parser,
      description,
      handler: (options, helpCommand, [command]) => {
        if (helpCommand !== "help") throw new DeveloperError("options setup messed up, command should be always on same place in results");
        if (command === undefined) console.log(this.help());
        else if (!this.#commands.has(command as never)) throw new UnknownCommandError(this, command as never);
        else console.log(this.helpCommand(command as never));
      },
    });
    return this as never;
  }

  parse(argv: string[] = ARGV): CommandsParserResults<OptionsResults, Commands> {
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
    readonly parser: CommandsParser<any, any>,
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
    readonly parser: CommandsParser<any, any>,
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
    readonly parser: CommandsParser<any, any>,
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
