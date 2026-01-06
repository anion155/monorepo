import { cached } from "@anion155/shared/decorators";
import { doRun } from "@anion155/shared/do";
import { createErrorClass } from "@anion155/shared/errors";
import { Curried, curryHelper } from "@anion155/shared/functional";

export const ARGV = process.argv.slice();
export const __interpretator = ARGV.shift();
export const __scriptName = ARGV.shift();

type OptionNames = Array<string | { name: string; short?: boolean }>;
type BaseOption<Type extends string, T = string> = { type: Type; default?: T; names: OptionNames; description?: string };

type StringOption = BaseOption<"string">;
type BooleanOption = BaseOption<"boolean", boolean>;
type EnumOption<Values> = BaseOption<"enum", Values> & { values: Values[] };
type HelpOption<Result> = BaseOption<"help"> & { handler: (parser: Pick<OptionsParser<any>, "help">, result: Result) => void };

type Option = StringOption | BooleanOption | EnumOption<unknown> | HelpOption<any>;
type OptionParams<_Option extends Option, _Partial extends keyof _Option = "names"> = Omit<PartialSome<_Option, _Partial>, "type">;
type OptionParamsDefault<_Option extends Option, _Partial extends keyof _Option = "names"> = Omit<
  PartialSome<_Option, _Partial>,
  "type" | "default"
> & { default: Exclude<_Option["default"], undefined> };

type OptionType<_Option extends Option> = _Option extends { type: "boolean" }
  ? boolean
  : _Option extends { type: "enum"; values: Array<infer Values> }
    ? Values
    : _Option extends { type: "string" }
      ? string
      : _Option extends { type: "help" }
        ? boolean
        : never;
type OptionNullable<_Option extends Option> = _Option extends { type: "help" }
  ? never
  : _Option extends { default: infer Default }
    ? Default extends undefined
      ? undefined
      : never
    : undefined;
type OptionsResults<Options extends Option[]> = { [I in keyof Options]: OptionType<Options[I]> | OptionNullable<Options[I]> };

type OptionItem = {
  index: number;
  option: Option;
  short: boolean;
  name: string;
};
type OptionsParserConfig = {
  short: boolean;
  oneArgValue: boolean;
  booleanValues: boolean;
  booleanNo: boolean;
  ignorable: boolean;
  shortBolleanGroups: boolean;
  longOneHyphen: boolean;
};

export type OptionParserUsageStyle = {
  indent?: string;
  columns?: number | `${number}%`;
  maxColumns?: number;
  formatted?: boolean;
};

/**
 * @example
 *  const [
 *    blah, // string | undefined
 *    jef, // boolean | undefined
 *    daah, // string
 *    lol, // boolean
 *  ] = new OptionsParser()
 *    .boolean("blah")
 *    .string("jef")
 *    .boolean("daah", { default: true })
 *    .string("lol", { default: "gogo" })
 *    .parse();
 */
export class OptionsParser<Options extends Option[] = []> {
  #config: Partial<OptionsParserConfig>;
  @cached
  get config() {
    const config = this.#config;
    return Object.freeze({
      short: config?.short ?? true,
      oneArgValue: config?.oneArgValue ?? true,
      booleanValues: config?.booleanValues ?? true,
      booleanNo: config?.booleanNo ?? true,
      ignorable: config?.ignorable ?? true,
      shortBolleanGroups: config?.shortBolleanGroups ?? true,
      longOneHyphen: config?.longOneHyphen ?? false,
    });
  }
  mergeConfig(other: OptionsParser<Option[]>) {
    cached.reset(this, "config");
    this.#config = { ...other.#config, ...this.#config };
  }

  #options: Options;
  get options() {
    return this.#options;
  }

  constructor(config?: Partial<OptionsParserConfig>) {
    this.#config = config ?? {};
    this.#options = [] as never;
  }

  #option<_Option extends Option>(option: _Option): OptionsParser<[...Options, _Option]> {
    this.#options.push(option);
    return this as never;
  }

  addString(name: string, option: OptionParamsDefault<StringOption>): OptionsParser<[...Options, RequiredSome<StringOption, "default">]>;
  addString(name: string, option?: OptionParams<StringOption>): OptionsParser<[...Options, StringOption]>;
  addString(name: string, option?: OptionParams<StringOption>) {
    return this.#option({ ...option, names: [name, ...(option?.names ?? [])], type: "string" });
  }

  addBoolean(name: string, option: OptionParamsDefault<BooleanOption>): OptionsParser<[...Options, RequiredSome<BooleanOption, "default">]>;
  addBoolean(name: string, option?: OptionParams<BooleanOption>): OptionsParser<[...Options, BooleanOption]>;
  addBoolean(name: string, option?: OptionParams<BooleanOption>) {
    return this.#option({ ...option, names: [name, ...(option?.names ?? [])], type: "boolean" });
  }

  addEnum<Values extends string[]>(
    ...values: Values
  ): Curried<{
    (
      name: string,
      option: OptionParamsDefault<EnumOption<Values[number]>, "names" | "values">,
    ): OptionsParser<[...Options, RequiredSome<EnumOption<Values[number]>, "default">]>;
    (name: string, option?: OptionParams<EnumOption<Values[number]>, "names" | "values">): OptionsParser<[...Options, EnumOption<Values[number]>]>;
  }> {
    return curryHelper((name: string, option?: OptionParams<EnumOption<Values[number]>, "names" | "values">) => {
      return this.#option({ ...option, names: [name, ...(option?.names ?? [])], type: "enum", values }) as never;
    });
  }

  addHelp(
    handler?: HelpOption<OptionsResults<Options>>["handler"] | OptionParserUsageStyle,
    description?: string,
  ): OptionsParser<[...Options, HelpOption<OptionsResults<Options>>]> {
    return this.#option({
      type: "help",
      names: ["help"],
      description: description ?? "Print this options help message",
      handler: doRun(() => {
        if (typeof handler === "function") return handler;
        return (parser) => {
          console.log(parser.help(handler));
        };
      }),
    });
  }

  #optionsMap() {
    const map = new Map<string, OptionItem>();
    this.#options.forEach((option, index) => {
      option.names.forEach((item) => {
        const { name, short } = typeof item === "string" ? { name: item } : item;
        if (short !== undefined) {
          map.set(name, { index, option, short, name });
        } else if (name.length === 1) {
          map.set(name, { index, option, short: true, name });
        } else {
          map.set(name, { index, option, short: false, name });
          if (this.config.short) {
            if (!map.has(name[0])) map.set(name[0], { index, option, short: true, name });
          }
        }
      });
    });
    return map;
  }
  static POSSIBLE_TRUE_VALUES = ["true", "t", "yes", "y"];
  static POSSIBLE_FALSE_VALUES = ["false", "f", "no", "n"];
  static POSSIBLE_BOOLEAN_VALUES = [...this.POSSIBLE_TRUE_VALUES, ...this.POSSIBLE_FALSE_VALUES];
  parse(argv: string[] = ARGV): OptionsResults<Options> {
    const map = this.#optionsMap();
    const values: OptionsResults<Options> = new Array(this.#options.length) as never;
    this.#options.forEach((option, index) => {
      if (option.default !== undefined) values[index] = option.default as never;
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
          if (this.config.shortBolleanGroups) {
            // ("-abcd");
            argv.unshift(...arg.split("").map((o) => `-${o}`));
            continue;
          }
          if (this.config.longOneHyphen) {
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
      if (this.config.ignorable && arg.startsWith("/") && arg.length > 1) {
        // ("--/arg");
        arg = arg.substring(1);
        ignore = true;
      }
      if (this.config.booleanNo && arg.startsWith("no-") && arg.length > 3) {
        // ("--no-arg");
        arg = arg.substring(3);
        value = false;
      }
      if (this.config.oneArgValue) {
        // ("--arg=value");
        const index = arg.indexOf("=");
        if (index > 0) {
          name = arg.substring(0, index);
          value = arg.substring(index + 1);
        }
      }
      if (name === undefined) name = arg;
      const byName = map.get(name);
      if (byName === undefined || byName.short !== short) throw new InvalidOptionError(this, `${short ? "-" : "--"}${name}`);
      if (byName.option.type === "boolean") {
        if (value === undefined) value = true;
        else if (this.config.booleanValues) {
          value = value.toString().toLowerCase();
          if (OptionsParser.POSSIBLE_TRUE_VALUES.includes(value)) value = true;
          else if (OptionsParser.POSSIBLE_FALSE_VALUES.includes(value)) value = true;
        }
        if (typeof value !== "boolean") throw new InvalidOptionError(this, byName);
      } else if (byName.option.type === "string") {
        if (value === undefined) {
          value = argv.shift();
          if (value !== undefined && value.startsWith("-")) throw new InvalidOptionError(this, byName);
        }
        if (typeof value !== "string") throw new InvalidOptionError(this, byName);
      } else if (byName.option.type === "enum") {
        if (value === undefined) {
          value = argv.shift();
          if (value !== undefined && value.startsWith("-")) throw new InvalidOptionError(this, byName);
        }
        if (!byName.option.values.includes(value)) throw new InvalidOptionError(this, byName);
      } else if (byName.option.type === "help") {
        if (value !== undefined) throw new InvalidOptionError(this, byName);
        byName.option.handler(this, values);
        throw new OptionParserBreak(this, byName, "help called");
      }
      if (!ignore) values[byName.index] = value as never;
    }
    return values;
  }

  optionUsage(desc: OptionItem) {
    const { short, name, option } = desc;
    const prefix = short ? "-" : "--";
    let values: string[] | undefined;
    if (option.type === "string") values = ["value"];
    else if (option.type === "enum") values = option.values.map(String);
    else if (option.type === "boolean") {
      if (this.config.booleanValues) values = OptionsParser.POSSIBLE_BOOLEAN_VALUES;
    }
    return `${prefix}${name}${values?.length ? ` <${values.join("|")}>` : ""}`;
  }

  static columns(style: OptionParserUsageStyle | undefined) {
    let columns;
    if (typeof style?.columns === "string") {
      columns = (process.stdout.columns * parseInt(style.columns)) / 100;
    } else if (style?.columns) {
      columns = style.columns;
    } else {
      columns = process.stdout.columns;
    }
    if (style?.maxColumns !== 0) {
      columns = Math.min(columns, style?.maxColumns ?? 120);
    }
    return columns;
  }
  help(style?: OptionParserUsageStyle): string {
    const indent = style?.indent ?? "";
    const columns = OptionsParser.columns(style);
    const formatted = style?.formatted ?? true;
    const namesLiness = this.#options.map((option) =>
      option.names.map((name) => (typeof name === "string" || !name.short ? `--${name}` : `-${name}`)).join(",\n"),
    );
    const namesWidth = Math.clamp(20, Math.max(...namesLiness.map((line) => line.length)), Math.trunc((columns - indent.length) / 3));
    const descriptionWidth = columns - indent.length - namesWidth - 1;
    return this.#options.reduce((str, option, index) => {
      const namesLines = namesLiness[index].wrap(namesWidth, true);
      const descriptionLines = doRun(() => {
        let description = option.description ?? "";
        description += `\n${`type: ${option.type}`.consoleFormat("bold", !formatted)}`;
        let values: string[] | undefined;
        if (option.type === "boolean") {
          if (this.config.booleanValues) values = OptionsParser.POSSIBLE_BOOLEAN_VALUES;
        } else if (option.type === "enum") {
          values = option.values.map(String);
        }
        if (values) description += `\n${`Possible values: ${values.join(" | ")}`.consoleFormat(["bold", "fgGreen"], !formatted)}`;
        if (option.default) description += `\n${`default: ${option.default}`.consoleFormat(["bold", "fgYellow"], !formatted)}`;
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

export abstract class UsageError extends createErrorClass("UsageError") {
  abstract help(style?: OptionParserUsageStyle): string;
}

export class InvalidOptionError extends UsageError {
  constructor(
    readonly parser: OptionsParser<Option[]>,
    readonly desc?: string | OptionItem,
    message?: string,
  ) {
    super(message ?? InvalidOptionError.message(parser, desc));
  }
  static message(parser: OptionsParser<Option[]>, desc?: string | OptionItem) {
    return typeof desc === "string" ? `invalid option: ${desc}` : desc ? `invalid option: ${parser.optionUsage(desc)}` : "invalid option";
  }

  help(style?: OptionParserUsageStyle): string {
    return this.parser.help(style);
  }
}

export class OptionParserBreak extends createErrorClass("OptionParserBreak") {
  constructor(
    readonly parser: OptionsParser<Option[]>,
    readonly desc?: string | OptionItem,
    message?: string,
  ) {
    super(message ?? InvalidOptionError.message(parser, desc));
  }
}

export type CommandsParserUsageStyle = OptionParserUsageStyle & {
  headers?: { options?: string; commands?: string };
};
export type CommandsParserCommandUsageStyle = CommandsParserUsageStyle & {
  nameWidth?: number;
};

type CommandResults<_Options extends Option[] | { general: Option[]; commands: any }> = _Options extends Option[]
  ? OptionsResults<_Options>
  : _Options extends { general: any; commands: any }
    ? CommandsResults<_Options["general"], _Options["commands"]>
    : never;
type CommandsResults<GeneralOptions extends Option[], Commands extends Record<string, Option[] | { general: Option[]; commands: any }>> = {
  [Command in keyof Commands]: [...OptionsResults<GeneralOptions>, Command, ...CommandResults<Commands[Command]>];
}[keyof Commands];

type CommandItem = {
  name: string;
  description?: string;
  parser: OptionsParser<Option[]> | CommandsParser<Option[], any>;
};

export class CommandsParser<
  GeneralOptions extends Option[] = [],
  Commands extends Record<string, Option[] | { general: Option[]; commands: any }> = {},
> {
  #general: OptionsParser<GeneralOptions>;
  get generalOptions() {
    return this.#general.options;
  }
  constructor(general: OptionsParser<GeneralOptions> = new OptionsParser()) {
    this.#general = general;
    general.options.forEach((option) => {
      if (option.type === "help") {
        const orig = option.handler;
        option.handler = (_, results) => orig(this, results);
      }
    });
  }

  #default: Extract<keyof Commands, string> | undefined;
  getFefault(): keyof Commands | undefined {
    return this.#default;
  }
  setDefault<Name extends Extract<keyof Commands, string>>(name: Name): CommandsParser<GeneralOptions, Commands> {
    this.#default = name;
    return this;
  }

  mergeConfig(parser: OptionsParser<Option[]>) {
    this.#general.mergeConfig(parser);
    this.#commands.values().forEach((command) => command.parser.mergeConfig(this.#general));
  }

  #commands = new Map<string, CommandItem>();
  get commandsOptions(): Commands {
    return Object.fromEntries(
      this.#commands
        .entries()
        .map(([command, { parser }]) => [
          command,
          parser instanceof CommandsParser ? [parser.generalOptions, parser.commandsOptions] : parser.options,
        ]),
    ) as never;
  }
  addCommand<Name extends string>(name: Name, description?: string) {
    return curryHelper(
      <Options extends Option[] = []>(parser?: OptionsParser<Options>): CommandsParser<GeneralOptions, Commands & { [name in Name]: Options }> => {
        parser?.mergeConfig(this.#general);
        parser?.options.forEach((option) => {
          if (option.type === "help") {
            const orig = option.handler;
            option.handler = (_, results) => orig({ help: (style) => this.helpCommand(name, style) }, results);
          }
        });
        this.#commands.set(name, { name, description, parser: parser ?? new OptionsParser() });
        return this as never;
      },
    );
  }
  addSubCommands<Name extends string>(name: Name, description?: string) {
    return curryHelper(
      <SubGeneralOptions extends Option[], SubCommands extends Record<string, Option[] | { general: Option[]; commands: any }>>(
        parser: CommandsParser<SubGeneralOptions, SubCommands>,
      ): CommandsParser<GeneralOptions, Commands & { [name in Name]: { general: SubGeneralOptions; commands: SubCommands } }> => {
        parser.mergeConfig(this.#general);
        this.#commands.set(name, { name, description, parser });
        return this as never;
      },
    );
  }
  addHelp(description?: string): CommandsParser<GeneralOptions, Commands & { help: { general: []; commands: { [Command in keyof Commands]: [] } } }> {
    let parser = new CommandsParser();
    this.#commands.forEach((item) => {
      parser = parser.addCommand(item.name, "Print help message for this command")();
    });
    this.#commands.set("help", { name: "help", description: description ?? "Print commands this message", parser });
    return this as never;
  }

  parse(argv: string[] = ARGV): CommandsResults<GeneralOptions, Commands> {
    try {
      const generalOptions = this.#general.parse(argv);
      const command = argv.shift() ?? this.#default;
      if (!command) throw new InvalidCommandError(this);
      const byName = this.#commands.get(command);
      if (!byName) throw new InvalidCommandError(this, command);
      try {
        const commandOptions = byName.parser.parse(argv);
        return [...generalOptions, command, ...commandOptions] as never;
      } catch (error) {
        if (error instanceof InvalidCommandError) throw new InvalidCommandNestedError(this, command, error);
        if (error instanceof InvalidCommandGeneralOptionError) throw new InvalidCommandNestedError(this, command, error);
        if (error instanceof InvalidCommandOptionError) throw new InvalidCommandNestedError(this, command, error);
        if (error instanceof InvalidCommandNestedError) throw new InvalidCommandNestedError(this, command, error);
        if (error instanceof InvalidOptionError) throw new InvalidCommandOptionError(this, command, error);
        throw error;
      }
    } catch (error) {
      if (error instanceof InvalidOptionError) throw new InvalidCommandGeneralOptionError(this, error);
      throw error;
    }
  }

  helpGeneral(style?: CommandsParserUsageStyle) {
    const indent = style?.indent ?? "";
    const optionsStyle: OptionParserUsageStyle = { ...style, indent: `${indent}  ` };
    const header = style?.headers?.options ?? "GENERAL OPTIONS";
    const formatted = style?.formatted ?? true;
    let general = this.#general.help(optionsStyle);
    if (general && header) general = `${indent}${`${header}:`.consoleFormat("bold", !formatted)}\n${general}`;
    return general;
  }
  helpCommand(name: string, style?: CommandsParserCommandUsageStyle) {
    const indent = style?.indent ?? "  ";
    const columns = OptionsParser.columns(style);
    const formatted = style?.formatted ?? true;
    const nameWidth =
      style?.nameWidth ??
      Math.clamp(10, Math.max(...this.#commands.values().map((command) => command.name.length)), Math.trunc((columns - indent.length) / 4));
    const descriptionWidth = columns - indent.length - nameWidth - 1;
    const item = this.#commands.get(name);
    if (!item) return "";
    const nameLines = item.name.wrap(nameWidth);
    const descriptionLines = doRun(() => {
      let description = item.description ?? "";
      if (this.#default === item.name) description += `\n${"[default]".consoleFormat("bold", !formatted)}`;
      return description;
    }).wrap(descriptionWidth);
    let str = "";
    str += Array.from({ length: Math.max(nameLines.length, descriptionLines.length) }, (_, i) => {
      const nameLine = (nameLines[i] ?? "").padEnd(nameWidth, " ");
      const descriptionLine = (descriptionLines[i] ?? "").padEnd(descriptionWidth, " ");
      return `${indent}${nameLine.consoleFormat("bold", !formatted)} ${descriptionLine}\n`;
    }).join("");
    // TODO: print command usage
    str += item.parser.help({
      ...style,
      indent: `${indent}  `,
      headers: {
        options: `${item.name.toUpperCase()} ${style?.headers?.options ?? "OPTIONS"}`,
        commands: `${item.name.toUpperCase()} ${style?.headers?.commands ?? "SUBCOMMANDS"}`,
      },
    });
    return str;
  }
  helpCommands(style?: CommandsParserUsageStyle) {
    const indent = style?.indent ?? "";
    const columns = OptionsParser.columns(style);
    const header = style?.headers?.commands ?? "COMMANDS";
    const formatted = style?.formatted ?? true;
    const namesWidth = Math.clamp(
      10,
      Math.max(...this.#commands.values().map((command) => command.name.length)),
      Math.trunc((columns - indent.length) / 4),
    );
    const commandsStyle: CommandsParserCommandUsageStyle = { ...style, indent: `${indent}  `, columns, nameWidth: namesWidth };
    let commands = this.#commands.keys().reduce((str, command) => {
      str += this.helpCommand(command, commandsStyle) + "\n";
      return str;
    }, "");
    if (commands && header) commands = `${indent}${`${header}:`.consoleFormat("bold", !formatted)}\n${commands}`;
    return commands;
  }
  help(style?: CommandsParserUsageStyle) {
    return [this.helpGeneral(style), this.helpCommands(style)].filter(Boolean).join("");
  }
}

export class InvalidCommandGeneralOptionError extends UsageError {
  constructor(
    readonly parser: CommandsParser<any, any>,
    readonly optionError: InvalidOptionError,
  ) {
    super(optionError.message);
  }

  help(style?: CommandsParserUsageStyle) {
    return this.parser.helpGeneral(style);
  }
}

export class InvalidCommandError extends UsageError {
  constructor(
    readonly parser: CommandsParser<any, any>,
    readonly desc?: string,
    message?: string,
  ) {
    super(message ?? InvalidCommandError.message(parser, desc));
  }
  static message(parser: CommandsParser<any, any>, desc?: string) {
    if (typeof desc === "string") return `invalid command: ${desc}`;
    let commands = Object.keys(parser.commandsOptions).join(" | ");
    if (parser.getFefault()) commands = `[${commands}]`;
    return `invalid command: ${commands}`;
  }

  help(style?: CommandsParserUsageStyle) {
    if (!this.desc) return this.parser.helpCommands(style);
    return this.parser.helpCommand(this.desc, style);
  }
}

export class InvalidCommandOptionError extends UsageError {
  constructor(
    readonly parser: CommandsParser<any, any>,
    readonly desc: string,
    readonly optionError: InvalidOptionError,
  ) {
    super(`${InvalidCommandError.message(parser, desc)}: ${optionError.message}`);
  }

  help(style?: CommandsParserUsageStyle) {
    return this.parser.helpCommand(this.desc, style);
  }
}

export class InvalidCommandNestedError extends UsageError {
  constructor(
    readonly parser: CommandsParser<any, any>,
    readonly desc: string,
    readonly cause: UsageError,
  ) {
    super(`${InvalidCommandError.message(parser, desc)}: ${cause.message}`);
  }

  help(style?: CommandsParserUsageStyle) {
    // TODO: print only specific help
    return this.parser.helpCommand(this.desc, style);
  }
}
