import { createErrorClass } from "@anion155/shared/errors";
import { $ } from "zx";

$.verbose = true;
$.stdio = "inherit";

export const __interpretator = process.argv.shift();
export const __scriptName = process.argv.shift();

type OptionNames = Array<string | { name: string; short?: boolean }>;
type BaseOption<Type extends string> = { type: Type; names: OptionNames };
type StringOptionExt = { default?: string };
type StringOption = BaseOption<"string"> & StringOptionExt;
type BooleanOptionExt = { default?: boolean };
type BooleanOption = BaseOption<"boolean"> & BooleanOptionExt;
type EnumOptionExt<Values> = { default?: Values };
type EnumOption<Values> = BaseOption<"enum"> & { values: Values[] } & EnumOptionExt<Values>;
type Option = StringOption | BooleanOption | EnumOption<unknown>;

type OptionType<_Option extends Option> = _Option["type"] extends "boolean" ? boolean : string;
type OptionNullable<_Option extends Option> = _Option extends { default: infer Default }
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

export interface ReadonlyOptionsParser<Options extends Option[]> {
  readonly config: Readonly<OptionsParserConfig>;
  readonly options: Options;
  parse(argv?: string[]): OptionsResults<Options>;
}

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
export class OptionsParser<Options extends Option[] = []> implements ReadonlyOptionsParser<Options> {
  #config: Readonly<OptionsParserConfig>;
  get config() {
    return this.#config;
  }

  #options: Options;
  get options() {
    return this.#options;
  }

  constructor(config?: Partial<OptionsParserConfig>) {
    this.#config = Object.freeze<OptionsParserConfig>({
      short: config?.short ?? true,
      oneArgValue: config?.oneArgValue ?? true,
      booleanValues: config?.booleanValues ?? true,
      booleanNo: config?.booleanNo ?? true,
      ignorable: config?.ignorable ?? true,
      shortBolleanGroups: config?.shortBolleanGroups ?? true,
      longOneHyphen: config?.longOneHyphen ?? false,
    });
    this.#options = [] as never;
  }

  #option<_Option extends Option>(option: _Option): OptionsParser<[...Options, _Option]> {
    this.#options.push(option);
    return this as never;
  }
  string<_Option extends { names?: OptionNames } & StringOptionExt = {}>(name: string, option?: _Option) {
    return this.#option<{ names: Option["names"]; type: "string" } & _Option>({
      ...option,
      names: [name, ...(option?.names ?? [])],
      type: "string",
    } as StringOption as never);
  }
  boolean<_Option extends { names?: OptionNames } & BooleanOptionExt = {}>(name: string, option?: _Option) {
    return this.#option<{ names: Option["names"]; type: "boolean" } & _Option>({
      ...option,
      names: [name, ...(option?.names ?? [])],
      type: "boolean",
    } as BooleanOption as never);
  }
  enum<Values extends unknown[], _Option extends { names?: OptionNames } & EnumOptionExt<Values> = {}>(
    name: string,
    values: Values,
    option?: _Option,
  ) {
    return this.#option<{ names: Option["names"]; type: "enum"; values: Values } & _Option>({
      ...option,
      names: [name, ...(option?.names ?? [])],
      type: "enum",
      values,
    } as EnumOption<Values[number]> as never);
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
          if (this.#config.short) {
            if (!map.has(name[0])) map.set(name[0], { index, option, short: true, name });
          }
        }
      });
    });
    return map;
  }
  parse(argv: string[] = process.argv): OptionsResults<Options> {
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
      const byName = map.get(name);
      if (byName === undefined) throw new InvalidOptionError(this, `${short ? "-" : "--"}${name}`);
      if (byName.option.type === "boolean") {
        if (value === undefined) value = true;
        else if (this.#config.booleanValues) {
          if (value === "true" || value === "t" || value === "yes" || value === "y") value = true;
          else if (value === "false" || value === "f" || value === "no" || value === "n") value = false;
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
      }
      if (!ignore) values[byName.index] = value as never;
    }
    return values;
  }
}

export function optionUsage(parser: ReadonlyOptionsParser<Option[]>, desc: OptionItem) {
  const { short, name, option } = desc;
  const prefix = short ? "-" : "--";
  let value = "";
  if (option.type === "string") value = ` <value>`;
  else if (option.type === "enum") value = ` <${option.values.join("|")}>`;
  else if (option.type === "boolean") {
    if (parser.config.booleanValues) value = `=<true|t|yes|y|false|f|no|n>`;
  }
  return `${prefix}${name}${value}`;
}

export class InvalidOptionError extends createErrorClass("InvalidOptionError") {
  constructor(
    readonly parser: ReadonlyOptionsParser<Option[]>,
    readonly desc?: string | OptionItem,
    message?: string,
  ) {
    super(message ?? InvalidOptionError.message(parser, desc));
  }

  static message(parser: ReadonlyOptionsParser<Option[]>, desc?: string | OptionItem) {
    return typeof desc === "string" ? `invalid option: ${desc}` : desc ? `invalid option: ${optionUsage(parser, desc)}` : "invalid option";
  }
}

type CommandsResults<GeneralOptions extends Option[], Commands extends Record<string, Option[]>> = {
  [Command in keyof Commands]: [...OptionsResults<GeneralOptions>, Command, ...OptionsResults<Commands[Command]>];
}[keyof Commands];

export interface ReadonlyCommandsParser<GeneralOptions extends Option[], Commands extends Record<string, Option[]>> {
  readonly generalOptions: GeneralOptions;
  readonly commandsOptions: Commands;
  getFefault(): keyof Commands | undefined;
  parse(argv?: string[]): CommandsResults<GeneralOptions, Commands>;
}

type CommandItem = {
  name: string;
  options: ReadonlyOptionsParser<Option[]>;
};

export class CommandsParser<GeneralOptions extends Option[] = [], Commands extends Record<string, Option[]> = {}>
  implements ReadonlyCommandsParser<GeneralOptions, Commands>
{
  #general: ReadonlyOptionsParser<GeneralOptions>;
  get generalOptions() {
    return this.#general.options;
  }
  constructor(general: ReadonlyOptionsParser<GeneralOptions> = new OptionsParser()) {
    this.#general = general;
  }

  #default: Extract<keyof Commands, string> | undefined;
  getFefault(): keyof Commands | undefined {
    return this.#default;
  }
  setDefault<Name extends Extract<keyof Commands, string>>(name: Name): CommandsParser<GeneralOptions, Commands> {
    this.#default = name;
    return this;
  }

  #commands = new Map<string, CommandItem>();
  get commandsOptions(): Commands {
    return Object.fromEntries(this.#commands.entries().map(([command, { options }]) => [command, options.options])) as never;
  }
  command<Name extends string, Options extends Option[] = []>(
    name: Name,
    options?: ReadonlyOptionsParser<Options>,
  ): CommandsParser<GeneralOptions, Commands & { [name in Name]: Options }> {
    this.#commands.set(name, { name, options: options ?? new OptionsParser() });
    return this as never;
  }

  parse(argv: string[] = process.argv): CommandsResults<GeneralOptions, Commands> {
    const generalOptions = this.#general.parse(argv);
    const command = argv.shift() ?? this.#default;
    if (!command) throw new InvalidCommandError(this as never);
    const byName = this.#commands.get(command);
    if (!byName) throw new InvalidCommandError(this as never, command);
    const commandOptions = byName.options.parse(argv);
    return [...generalOptions, command, ...commandOptions] as never;
  }
}

export class InvalidCommandError extends createErrorClass("InvalidCommandError") {
  constructor(
    readonly parser: ReadonlyCommandsParser<Option[], Record<string, Option[]>>,
    readonly desc?: string | CommandItem,
    message?: string,
  ) {
    super(message ?? InvalidCommandError.usage(parser, desc));
  }

  static usage(parser: ReadonlyCommandsParser<Option[], Record<string, Option[]>>, desc?: string | CommandItem) {
    if (typeof desc === "string") return `invalid command: ${desc}`;
    if (desc) return `invalid command: ${desc.name}`;
    let commands = Object.keys(parser.commandsOptions).join(" | ");
    if (parser.getFefault()) commands = `[${commands}]`;
    return `invalid command: ${commands}`;
  }
  usage() {
    return InvalidCommandError.usage(this.parser, this.desc);
  }
}
