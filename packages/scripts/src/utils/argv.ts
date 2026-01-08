import { doRun } from "@anion155/shared/do";
import { createErrorClass } from "@anion155/shared/errors";
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
  short: boolean;
  oneArgValue: boolean;
  booleanValues: boolean;
  booleanNo: boolean;
  ignorable: boolean;
  shortBolleanGroups: boolean;
  longOneHyphen: boolean;
};
export type OptionParserHelpStyle = ArgvParserHelpStyle;

const POSSIBLE_TRUE_VALUES = ["true", "t", "yes", "y"];
const POSSIBLE_FALSE_VALUES = ["false", "f", "no", "n"];
const POSSIBLE_BOOLEAN_VALUES = [...POSSIBLE_TRUE_VALUES, ...POSSIBLE_FALSE_VALUES];

export class OptionsParser<Results extends unknown[] = []> extends ArgvParser<Results> {
  constructor(config?: Partial<OptionsParserConfig>) {
    super();
    this.#config = Object.freeze({
      short: config?.short ?? true,
      oneArgValue: config?.oneArgValue ?? true,
      booleanValues: config?.booleanValues ?? true,
      booleanNo: config?.booleanNo ?? true,
      ignorable: config?.ignorable ?? true,
      shortBolleanGroups: config?.shortBolleanGroups ?? true,
      longOneHyphen: config?.longOneHyphen ?? false,
    });
  }

  clone(): this {
    const cloned = new OptionsParser<Results>();
    cloned.#config = this.#config;
    cloned.#options = this.#options.slice();
    return cloned as never;
  }

  #config: OptionsParserConfig;

  #options: Option[] = [];
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

  #helpHandler?: () => void;
  addHelp(description: string = "Print this message", style?: OptionParserHelpStyle) {
    return this.addBreak(() => {
      if (this.#helpHandler) {
        this.#helpHandler();
      } else {
        console.log(this.help(style));
      }
    })("help", { description });
  }
  setHelpHandler(handler: () => void) {
    this.#helpHandler = handler;
  }

  parse(argv: string[] = ARGV): Results {
    type OmitUnions<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
    type IntersectUnions<T, U> = T extends unknown ? T & U : never;
    type OptionItem = IntersectUnions<
      OmitUnions<Option, "names">,
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
        if (this.#config.booleanValues) values = POSSIBLE_BOOLEAN_VALUES;
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
          if (this.#config.short) {
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
          if (this.#config.shortBolleanGroups) {
            // ("-abcd");
            argv.unshift(...arg.split("").map((o) => `-${o}`));
            continue;
          }
          if (this.#config.longOneHyphen) {
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
      if (this.#config.ignorable && arg.startsWith("/") && arg.length > 1) {
        // ("--/arg");
        arg = arg.substring(1);
        ignore = true;
      }
      if (this.#config.booleanNo && arg.startsWith("no-") && arg.length > 3) {
        // ("--no-arg");
        arg = arg.substring(3);
        value = false;
      }
      if (this.#config.oneArgValue) {
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
        else if (this.#config.booleanValues) {
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
    const { indent, width, formatted } = normalizeParserStyles(style);
    const namesLiness = this.#options.map((option) =>
      option.names.map((name) => (typeof name === "string" || !name.short ? `--${name}` : `-${name}`)).join(",\n"),
    );
    const namesWidth = Math.clamp(20, Math.max(...namesLiness.map((line) => line.length)), Math.trunc((width - indent.length) / 3));
    const descriptionWidth = width - indent.length - namesWidth - 1;
    return this.#options.reduce((str, option, index) => {
      const namesLines = namesLiness[index].wrap(namesWidth, true);
      const descriptionLines = doRun(() => {
        let description = option.description ?? "";
        description += `\n${`type: ${option.type}`.consoleFormat("bold", !formatted)}`;
        let values: string[] | undefined;
        if (option.type === "boolean") {
          if (this.#config.booleanValues) values = POSSIBLE_BOOLEAN_VALUES;
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
      return str;
    }, "");
  }
}
export function optionsParser(config?: Partial<OptionsParserConfig>) {
  return new OptionsParser(config);
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
  optionsHeader?: string;
  commandsHeader?: string;
};

type CommandsParserResults<OptionsResults extends unknown[], Commands extends Record<string, ArgvParser<unknown[]>>> =
  | { [Command in keyof Commands]: [...OptionsResults, Command, ...ReturnType<Commands[Command]["parse"]>] }[keyof Commands]
  | [...OptionsResults, undefined];

export class CommandsParser<OptionsResults extends unknown[] = [], Commands extends Record<string, ArgvParser<unknown[]>> = {}> extends ArgvParser<
  CommandsParserResults<OptionsResults, Commands>
> {
  constructor(options?: OptionsParser<OptionsResults>) {
    super();
    this.#options = options ?? (noopParser as never);
  }

  clone() {
    const cloned = new CommandsParser<OptionsResults, Commands>();
    cloned.#options = this.#options.clone();
    cloned.#commands = new Map(this.#commands.entries().map(([command, { parser, ...rest }]) => [command, { ...rest, parser: parser.clone() }]));
    return cloned as never;
  }

  #options: OptionsParser<OptionsResults>;
  modifyOptions<Results extends unknown[]>(
    modifier: (current: OptionsParser<OptionsResults>) => OptionsParser<Results>,
  ): CommandsParser<Results, Commands> {
    this.#options = modifier(this.#options) as never;
    return this as never;
  }

  #commands = new Map<keyof Commands, { parser: ArgvParser<unknown[]>; description?: string }>();
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
  addHelp(
    description: string = "Print commands help",
  ): CommandsParser<OptionsResults, Commands & { help: CommandsParser<[], { [Command in keyof Commands]: NoopParser }> }> {
    const parser = this.#commands.entries().reduce<CommandsParser>((parser, [command, {}]) => {
      return parser.addCommand(command as never, `Print help message for '${String(command)}' command`)();
    }, new CommandsParser());
    this.#commands.set("help", { parser, description });
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

  helpOptions(style?: CommandsParserHelpStyle) {
    const { indent, width, formatted } = normalizeParserStyles(style);
    const header = style?.optionsHeader ?? "GENERAL OPTIONS";
    let optionsHelp = this.#options.help({ indent: indent + "  ", width, formatted });
    if (optionsHelp && header) optionsHelp = `${indent}${`${header}:`.consoleFormat("bold", !formatted)}\n${optionsHelp}`;
    return optionsHelp;
  }
  helpCommand(command: keyof Commands, style?: CommandsParserHelpStyle, namesWidth?: number) {
    command = String(command);
    const { indent, width, formatted } = normalizeParserStyles(style);
    if (namesWidth === undefined) {
      namesWidth = Math.max(10, Math.trunc((width - indent.length) / 4));
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
    str += stored.parser.help({
      indent,
      width,
      formatted,
      optionsHeader: `${command.toUpperCase()} ${style?.optionsHeader ?? "OPTIONS"}`,
      commandsHeader: `${command.toUpperCase()} ${style?.commandsHeader ?? "SUBCOMMANDS"}`,
    } as CommandsParserHelpStyle | OptionParserHelpStyle);
    return str;
  }
  helpCommands(style?: CommandsParserHelpStyle) {
    const { indent, width, formatted } = normalizeParserStyles(style);
    const header = style?.commandsHeader ?? "COMMANDS";
    const namesWidth = Math.clamp(
      10,
      Math.max(...this.#commands.keys().map((command) => String(command).length)),
      Math.trunc((width - indent.length) / 4),
    );
    const commandsStyle: CommandsParserHelpStyle = { indent: indent + "  ", width, formatted };
    let commands = this.#commands.keys().reduce<string>((str, command) => {
      str += this.helpCommand(command, commandsStyle, namesWidth) + "\n";
      return str;
    }, "");
    if (commands && header) commands = `${indent}${`${header}:`.consoleFormat("bold", !formatted)}\n${commands}`;
    return commands;
  }
  help(style?: CommandsParserHelpStyle) {
    return [this.helpOptions(style), this.helpCommands(style)].filter(Boolean).join("");
  }
}
export function commandsParser<OptionsResults extends unknown[] = []>(options?: OptionsParser<OptionsResults>) {
  return new CommandsParser(options);
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
    return this.parser.helpCommand(this.command, style);
  }
}
