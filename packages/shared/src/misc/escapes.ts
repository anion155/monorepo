/** Terminal bell */
const BEL = "\u0007" as const;
/** Backspace */
const BS = "\u0008" as const;
/** Horizontal TAB */
const HT = "\u0009" as const;
/** Linefeed (newline) */
const LF = "\u000a" as const;
/** Vertical TAB */
const VT = "\u000b" as const;
/** Formfeed (also: New page NP) */
const FF = "\u000c" as const;
/** Carriage return */
const CR = "\u000d" as const;
/** Escape character */
const ESC = "\u001b" as const;
/** Delete character */
const DEL = "\u007f" as const;

/** Control Sequence Introducer: sequence starting with ESC [ or CSI (\x9B). */
const CSI = <Command extends string>(command: Command) => `${ESC}[${command}` as const;

/** Device Control String: sequence starting with ESC P or DCS (\x90). */
const DCS = <Command extends string>(command: Command) => `${ESC}P${command}` as const;

/** Operating System Command: sequence starting with ESC ] or OSC (\x9D). */
const OSC = <Command extends string>(command: Command) => `${ESC}]${command}` as const;

const ConsoleCursor = {
  /** moves cursor to home position ({@link line}, {@link column}) */
  moveTo: (line: number = 0, column: number = 0) => (!line && !column ? CSI("H") : CSI(`${line};${column}H`)),
  /** moves cursor to home position ({@link line}, {@link column}) */
  moveToF: (line: number, column: number) => CSI(`${line};${column}f`),
  /** moves cursor up {@link lines} */
  moveUp: (lines: number = 1) => CSI(`${lines}A`),
  /** moves cursor down {@link lines} */
  moveDown: (lines: number = 1) => CSI(`${lines}B`),
  /** moves cursor right {@link columns} */
  moveRight: (columns: number = 1) => CSI(`${columns}C`),
  /** moves cursor left {@link columns} */
  moveLeft: (columns: number = 1) => CSI(`${columns}D`),
  /** moves cursor to beginning of next line, {@link lines} down */
  moveDownAndStart: (lines: number = 1) => CSI(`${lines}E`),
  /** moves cursor to beginning of previous line, {@link lines} up */
  moveUpAndStart: (lines: number = 1) => CSI(`${lines}F`),
  /** moves cursor to {@link column} */
  moveToColumn: (column: number) => CSI(`${column}G`),
  /** request cursor position (reports as ESC[<line>;<column>R) */
  requestPosition: CSI("6n"),
  /** moves cursor one line up, scrolling if needed */
  scrollUp: `${ESC}M`,
  /** save cursor position (DEC) */
  save: `${ESC}7`,
  /** restores the cursor to the last saved position (DEC) */
  restore: `${ESC}8`,

  /** change cursor visibility */
  visibility: [CSI("25h"), CSI("25l")],
  modes: {
    // /** changes cursor shape to steady block */
    // steadyBlock: CSI('0 q'),
    /** changes cursor shape to steady block also */
    steadyBlock: CSI("1 q"),
    /** changes cursor shape to blinking block */
    blinkingBlock: CSI("2 q"),
    /** changes cursor shape to steady underline */
    steadyUnderline: CSI("3 q"),
    /** changes cursor shape to blinking underline */
    blinkingUnderline: CSI("4 q"),
    /** changes cursor shape to steady bar */
    steadyBar: CSI("5 q"),
    /** changes cursor shape to blinking bar */
    blinkingBar: CSI("6 q"),
  },
} as const;

const ConsoleErase = {
  /** erase in display (same as ESC[0J) */
  clearInDisplay: CSI("J"),
  /** erase from cursor until end of screen */
  clearFromCursorToScreenEnd: CSI("0J"),
  /** erase from cursor to beginning of screen */
  clearFromCursorToScreenStart: CSI("1J"),
  /** erase entire screen */
  clear: CSI("2J"),
  /** erase saved lines */
  clearScroll: CSI("3J"),
  /** erase in line (same as ESC[0K) */
  clearInLine: CSI("K"),
  /** erase from cursor to end of line */
  clearFromCursorToLineEnd: CSI("0K"),
  /** erase start of line to the cursor */
  clearFromCursorToLineStart: CSI("1K"),
  /** erase the entire line */
  clearLine: CSI("2K"),
} as const;

const ConsoleFormatResetModes = 0;
export type ConsoleFormatResetModes = typeof ConsoleFormatResetModes;
const ConsoleFormatModes = {
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  doubleUnderline: [21, 24],
  blinking: [5, 25],
  inverse: [7, 27],
  invisible: [8, 28],
  strikethrough: [9, 29],
  framed: [51, 54],
  overline: [53, 55],
} as const;
export type ConsoleFormatModes = ConsoleFormatResetModes | (typeof ConsoleFormatModes)[keyof typeof ConsoleFormatModes][0 | 1];

const ConsoleFormatColorsValues = {
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7,
  default: 9,
} as const;
type _ConsoleFormatColorsValues = typeof ConsoleFormatColorsValues;
const mapColorsValues = <Result>(
  project: (
    entry: [keyof _ConsoleFormatColorsValues, _ConsoleFormatColorsValues[keyof _ConsoleFormatColorsValues]],
  ) => [keyof Result, Result[keyof Result]],
): Result => {
  // @ts-expect-error - types issues
  return Object.fromEntries(Object.entries(ConsoleFormatColorsValues).map(project));
};
export type ConsoleFormatColorsValues = _ConsoleFormatColorsValues[keyof _ConsoleFormatColorsValues];

const ConsoleFormat4bForegroundColors = mapColorsValues<{
  readonly [N in keyof _ConsoleFormatColorsValues as `fg${Capitalize<N>}`]: ToNumber<`3${_ConsoleFormatColorsValues[N]}`>;
}>(([name, value]) => [`fg${name[0].toUpperCase()}${name.substring(1)}`, 30 + value] as never);
export type ConsoleFormat4bForegroundColors = (typeof ConsoleFormat4bForegroundColors)[keyof typeof ConsoleFormat4bForegroundColors];
export type ConsoleFormat4bForegroundLegacyBrightColors = `${ConsoleFormat4bForegroundColors};1`;

const ConsoleFormat4bBackgroundColors = mapColorsValues<{
  readonly [N in keyof _ConsoleFormatColorsValues as `bg${Capitalize<N>}`]: ToNumber<`4${_ConsoleFormatColorsValues[N]}`>;
}>(([name, value]) => [`bg${name[0].toUpperCase()}${name.substring(1)}`, 40 + value] as never);
export type ConsoleFormat4bBackgroundColors = (typeof ConsoleFormat4bBackgroundColors)[keyof typeof ConsoleFormat4bBackgroundColors];
export type ConsoleFormat4bBackgroundLegacyBrightColors = `${ConsoleFormat4bBackgroundColors};1`;

const ConsoleFormat4bForegroundBrightColors = mapColorsValues<{
  readonly [N in keyof _ConsoleFormatColorsValues as `fgBr${Capitalize<N>}`]: ToNumber<`9${_ConsoleFormatColorsValues[N]}`>;
}>(([name, value]) => [`fgBr${name[0].toUpperCase()}${name.substring(1)}`, 90 + value] as never);
export type ConsoleFormat4bForegroundBrightColors =
  (typeof ConsoleFormat4bForegroundBrightColors)[keyof typeof ConsoleFormat4bForegroundBrightColors];

const ConsoleFormat4bBackgroundBrightColors = mapColorsValues<{
  readonly [N in keyof _ConsoleFormatColorsValues as `bgBr${Capitalize<N>}`]: ToNumber<`10${_ConsoleFormatColorsValues[N]}`>;
}>(([name, value]) => [`bgBr${name[0].toUpperCase()}${name.substring(1)}`, 100 + value] as never);
export type ConsoleFormat4bBackgroundBrightColors =
  (typeof ConsoleFormat4bBackgroundBrightColors)[keyof typeof ConsoleFormat4bBackgroundBrightColors];

const ConsoleFormat4bForegroundPairs = {
  fgBlack: [ConsoleFormat4bForegroundColors.fgBlack, ConsoleFormat4bForegroundColors.fgDefault],
  fgRed: [ConsoleFormat4bForegroundColors.fgRed, ConsoleFormat4bForegroundColors.fgDefault],
  fgGreen: [ConsoleFormat4bForegroundColors.fgGreen, ConsoleFormat4bForegroundColors.fgDefault],
  fgYellow: [ConsoleFormat4bForegroundColors.fgYellow, ConsoleFormat4bForegroundColors.fgDefault],
  fgBlue: [ConsoleFormat4bForegroundColors.fgBlue, ConsoleFormat4bForegroundColors.fgDefault],
  fgMagenta: [ConsoleFormat4bForegroundColors.fgMagenta, ConsoleFormat4bForegroundColors.fgDefault],
  fgCyan: [ConsoleFormat4bForegroundColors.fgCyan, ConsoleFormat4bForegroundColors.fgDefault],
  fgWhite: [ConsoleFormat4bForegroundColors.fgWhite, ConsoleFormat4bForegroundColors.fgDefault],

  fgBrBlack: [ConsoleFormat4bForegroundBrightColors.fgBrBlack, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrRed: [ConsoleFormat4bForegroundBrightColors.fgBrRed, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrGreen: [ConsoleFormat4bForegroundBrightColors.fgBrGreen, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrYellow: [ConsoleFormat4bForegroundBrightColors.fgBrYellow, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrBlue: [ConsoleFormat4bForegroundBrightColors.fgBrBlue, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrMagenta: [ConsoleFormat4bForegroundBrightColors.fgBrMagenta, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrCyan: [ConsoleFormat4bForegroundBrightColors.fgBrCyan, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrWhite: [ConsoleFormat4bForegroundBrightColors.fgBrWhite, ConsoleFormat4bForegroundColors.fgDefault],

  fgGray: [ConsoleFormat4bForegroundBrightColors.fgBrBlack, ConsoleFormat4bForegroundColors.fgDefault],
  fgGrey: [ConsoleFormat4bForegroundBrightColors.fgBrBlack, ConsoleFormat4bForegroundColors.fgDefault],
};
export type ConsoleFormat4bForegroundColorNames = keyof typeof ConsoleFormat4bForegroundPairs;
const ConsoleFormat4bNodeCompatPairs = {
  black: [ConsoleFormat4bForegroundColors.fgBlack, ConsoleFormat4bForegroundColors.fgDefault],
  red: [ConsoleFormat4bForegroundColors.fgRed, ConsoleFormat4bForegroundColors.fgDefault],
  green: [ConsoleFormat4bForegroundColors.fgGreen, ConsoleFormat4bForegroundColors.fgDefault],
  yellow: [ConsoleFormat4bForegroundColors.fgYellow, ConsoleFormat4bForegroundColors.fgDefault],
  blue: [ConsoleFormat4bForegroundColors.fgBlue, ConsoleFormat4bForegroundColors.fgDefault],
  magenta: [ConsoleFormat4bForegroundColors.fgMagenta, ConsoleFormat4bForegroundColors.fgDefault],
  cyan: [ConsoleFormat4bForegroundColors.fgCyan, ConsoleFormat4bForegroundColors.fgDefault],
  white: [ConsoleFormat4bForegroundColors.fgWhite, ConsoleFormat4bForegroundColors.fgDefault],
  gray: [ConsoleFormat4bForegroundBrightColors.fgBrBlack, ConsoleFormat4bForegroundColors.fgDefault],
  grey: [ConsoleFormat4bForegroundBrightColors.fgBrBlack, ConsoleFormat4bForegroundColors.fgDefault],
};
export type ConsoleFormat4bNodeCompatColorNames = keyof typeof ConsoleFormat4bNodeCompatPairs;
const ConsoleFormat4bBackgroundPairs = {
  bgBlack: [ConsoleFormat4bBackgroundColors.bgBlack, ConsoleFormat4bBackgroundColors.bgDefault],
  bgRed: [ConsoleFormat4bBackgroundColors.bgRed, ConsoleFormat4bBackgroundColors.bgDefault],
  bgGreen: [ConsoleFormat4bBackgroundColors.bgGreen, ConsoleFormat4bBackgroundColors.bgDefault],
  bgYellow: [ConsoleFormat4bBackgroundColors.bgYellow, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBlue: [ConsoleFormat4bBackgroundColors.bgBlue, ConsoleFormat4bBackgroundColors.bgDefault],
  bgMagenta: [ConsoleFormat4bBackgroundColors.bgMagenta, ConsoleFormat4bBackgroundColors.bgDefault],
  bgCyan: [ConsoleFormat4bBackgroundColors.bgCyan, ConsoleFormat4bBackgroundColors.bgDefault],
  bgWhite: [ConsoleFormat4bBackgroundColors.bgWhite, ConsoleFormat4bBackgroundColors.bgDefault],

  bgBrBlack: [ConsoleFormat4bBackgroundBrightColors.bgBrBlack, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrRed: [ConsoleFormat4bBackgroundBrightColors.bgBrRed, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrGreen: [ConsoleFormat4bBackgroundBrightColors.bgBrGreen, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrYellow: [ConsoleFormat4bBackgroundBrightColors.bgBrYellow, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrBlue: [ConsoleFormat4bBackgroundBrightColors.bgBrBlue, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrMagenta: [ConsoleFormat4bBackgroundBrightColors.bgBrMagenta, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrCyan: [ConsoleFormat4bBackgroundBrightColors.bgBrCyan, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrWhite: [ConsoleFormat4bBackgroundBrightColors.bgBrWhite, ConsoleFormat4bBackgroundColors.bgDefault],

  bgGray: [ConsoleFormat4bBackgroundBrightColors.bgBrBlack, ConsoleFormat4bBackgroundColors.bgDefault],
  bgGrey: [ConsoleFormat4bBackgroundBrightColors.bgBrBlack, ConsoleFormat4bBackgroundColors.bgDefault],
};
export type ConsoleFormat4bBackgroundColorNames = keyof typeof ConsoleFormat4bBackgroundPairs;
const ConsoleFormat4bPairs = {
  ...ConsoleFormat4bForegroundPairs,
  ...ConsoleFormat4bNodeCompatPairs,
  ...ConsoleFormat4bBackgroundPairs,
};
export type ConsoleFormat4bColorNames = keyof typeof ConsoleFormat4bPairs;

const ConsoleFormat4bAllForegroundColors = {
  ...ConsoleFormat4bForegroundColors,
  ...ConsoleFormat4bForegroundBrightColors,
  fgPairs: ConsoleFormat4bForegroundPairs,
  fgNodePairs: ConsoleFormat4bNodeCompatPairs,
};
export type ConsoleFormat4bAllForegroundColors =
  | (typeof ConsoleFormat4bAllForegroundColors)[Exclude<keyof typeof ConsoleFormat4bAllForegroundColors, "fgPairs" | "fgNodePairs">]
  | ConsoleFormat4bForegroundLegacyBrightColors;
const ConsoleFormat4bAllBackgroundColors = {
  ...ConsoleFormat4bBackgroundColors,
  ...ConsoleFormat4bBackgroundBrightColors,
  bgPairs: ConsoleFormat4bBackgroundPairs,
};
export type ConsoleFormat4bAllBackgroundColors =
  | (typeof ConsoleFormat4bAllBackgroundColors)[Exclude<keyof typeof ConsoleFormat4bAllBackgroundColors, "bgPairs">]
  | ConsoleFormat4bBackgroundLegacyBrightColors;
const ConsoleFormat4bColors = {
  ...ConsoleFormat4bAllForegroundColors,
  ...ConsoleFormat4bAllBackgroundColors,
  pairs: ConsoleFormat4bPairs,
};
export type ConsoleFormat4bColors = ConsoleFormat4bAllForegroundColors | ConsoleFormat4bAllBackgroundColors;

const ConsoleFormat8bColors = {
  foreground: (color: number) => `38;5;${color}`,
  background: (color: number) => `48;5;${color}`,
  standard: { ...ConsoleFormatColorsValues },
  highIntensity: mapColorsValues<{
    readonly [N in Exclude<keyof _ConsoleFormatColorsValues, "default">]: AddPositiveNumbers<_ConsoleFormatColorsValues[N], 8>;
  }>(([name, value]) => [name, 8 + value] as never),
  rgb(r: RangeTuple<0, 7>[number], g: RangeTuple<0, 7>[number], b: RangeTuple<0, 7>[number]) {
    return 16 + 36 * r + 6 * g + b;
  },
  grayscale: Array.from({ length: 24 }, (_, i) => 232 + i) as RangeTuple<232, 256>,
} as const;
export type ConsoleFormat8bForegroundColors = `38;5;${number}`;
export type ConsoleFormat8bBackgroundColors = `48;5;${number}`;
export type ConsoleFormat8bColors = ConsoleFormat8bForegroundColors | ConsoleFormat8bBackgroundColors;

const ConsoleFormat24bColors = {
  foreground: (r: Byte, g: Byte, b: Byte) => `38;2;${r};${g};${b}`,
  background: (r: Byte, g: Byte, b: Byte) => `48;2;${r};${g};${b}`,
};
export type ConsoleFormat24bForegroundColors = `38;2;${number};${number};${number}`;
export type ConsoleFormat24bBackgroundColors = `48;2;${number};${number};${number}`;
export type ConsoleFormat24bColors = ConsoleFormat24bForegroundColors | ConsoleFormat24bBackgroundColors;

const ConsoleFormatColors = {
  "4bit": ConsoleFormat4bColors,
  fg4bit: ConsoleFormat4bAllForegroundColors,
  bg4bit: ConsoleFormat4bAllBackgroundColors,
  "8bit": ConsoleFormat8bColors,
  "24bit": ConsoleFormat24bColors,
} as const;
export type ConsoleFormatForegroundColors = ConsoleFormat4bAllForegroundColors | ConsoleFormat8bForegroundColors | ConsoleFormat24bForegroundColors;
export type ConsoleFormatBackgroundColors = ConsoleFormat4bAllBackgroundColors | ConsoleFormat8bBackgroundColors | ConsoleFormat24bBackgroundColors;
export type ConsoleFormatColors = ConsoleFormat4bColors | ConsoleFormat8bColors | ConsoleFormat24bColors;

export type ConsoleFormat = ConsoleFormatModes | ConsoleFormatColors;

const consoleFormat = (...params: ConsoleFormat[]) => CSI(`${params.join(";")}m`);

/** Changes the screen width or type. */
const ConsoleScreenModes = {
  /** 40 x 25 monochrome (text) */
  "1b40x25": [CSI("=0h"), CSI("=0l")],
  /** 40 x 25 color (text) */
  "4b40x25": [CSI("=1h"), CSI("=1l")],
  /** 80 x 25 monochrome (text) */
  "1b80x25": [CSI("=2h"), CSI("=2l")],
  /** 80 x 25 color (text) */
  "4b80x25": [CSI("=3h"), CSI("=3l")],
  /** 320 x 200 4-color (graphics) */
  "2b320x200": [CSI("=4h"), CSI("=4l")],
  /** 320 x 200 monochrome (graphics) */
  "1b320x200": [CSI("=5h"), CSI("=5l")],
  /** 640 x 200 monochrome (graphics) */
  "1b640x200": [CSI("=6h"), CSI("=6l")],
  /** 320 x 200 color (graphics) */
  "4b320x200": [CSI("=13h"), CSI("=13l")],
  /** 640 x 200 color (16-color graphics) */
  "4b640x200": [CSI("=14h"), CSI("=14l")],
  /** 640 x 350 monochrome (2-color graphics) */
  "1b640x350": [CSI("=15h"), CSI("=15l")],
  /** 640 x 350 color (16-color graphics) */
  "4b640x350": [CSI("=16h"), CSI("=16l")],
  /** 640 x 480 monochrome (2-color graphics) */
  "1b640x480": [CSI("=17h"), CSI("=17l")],
  /** 640 x 480 color (16-color graphics) */
  "4b640x480": [CSI("=18h"), CSI("=18l")],
  /** 320 x 200 color (256-color graphics) */
  "8b640x480": [CSI("=19h"), CSI("=19l")],
};

/** Enables line wrapping */
const ConsoleScreenWrapping = [CSI("=7h"), CSI("=7l")];

const ConsolePrivateScreenModes = {
  /** restore screen */
  restoreScreen: CSI("47l"),
  /** save screen */
  saveScreen: CSI("47h"),
  /** enables/disables the alternative buffer */
  alternativeBuffer: [CSI("1049h"), CSI("1049l")],
};

/** keyboard codes: code, SHIFT+code, CTRL+code, ALT+code */
const ConsoleKeyboardCodes = {
  F1: ["0;59", "0;84", "0;94", "0;104"],
  F2: ["0;60", "0;85", "0;95", "0;105"],
  F3: ["0;61", "0;86", "0;96", "0;106"],
  F4: ["0;62", "0;87", "0;97", "0;107"],
  F5: ["0;63", "0;88", "0;98", "0;108"],
  F6: ["0;64", "0;89", "0;99", "0;109"],
  F7: ["0;65", "0;90", "0;100", "0;110"],
  F8: ["0;66", "0;91", "0;101", "0;111"],
  F9: ["0;67", "0;92", "0;102", "0;112"],
  F10: ["0;68", "0;93", "0;103", "0;113"],
  F11: ["0;133", "0;135", "0;137", "0;139"],
  F12: ["0;134", "0;136", "0;138", "0;140"],
  HOME_num_keypad: ["0;71", "55", "0;119", null],
  UP_ARROW_num_keypad: ["0;72", 56, "0;141", null],
  PAGE_UP_num_keypad: ["0;73", 57, "0;132", null],
  LEFT_ARROW_num_keypad: ["0;75", 52, "0;115", null],
  RIGHT_ARROW_num_keypad: ["0;77", 54, "0;116", null],
  END_num_keypad: ["0;79", 49, "0;117", null],
  DOWN_ARROW_num_keypad: ["0;80", 50, "0;145", null],
  PAGE_DOWN_num_keypad: ["0;81", 51, "0;118", null],
  INSERT_num_keypad: ["0;82", 48, "0;146", null],
  DELETE_num_keypad: ["0;83", 46, "0;147", null],
  HOME: ["224;71", "224;71", "224;119", "224;151"],
  UP_ARROW: ["224;72", "224;72", "224;141", "224;152"],
  PAGE_UP: ["224;73", "224;73", "224;132", "224;153"],
  LEFT_ARROW: ["224;75", "224;75", "224;115", "224;155"],
  RIGHT_ARROW: ["224;77", "224;77", "224;116", "224;157"],
  END: ["224;79", "224;79", "224;117", "224;159"],
  DOWN_ARROW: ["224;80", "224;80", "224;145", "224;154"],
  PAGE_DOWN: ["224;81", "224;81", "224;118", "224;161"],
  INSERT: ["224;82", "224;82", "224;146", "224;162"],
  DELETE: ["224;83", "224;83", "224;147", "224;163"],
  PRINT_SCREEN: [null, null, "0;114", null],
  PAUSE_BREAK: [null, null, "0;0", null],
  BACKSPACE: [8, 8, 127, null],
  ENTER: [13, null, 10, null],
  TAB: [9, "0;15", "0;148", "0;165"],
  NULL: ["0;3", null, null, null],
  A: [97, 65, 1, "0;30"],
  B: [98, 66, 2, "0;48"],
  C: [99, 67, 3, "0;46"],
  D: [100, 68, 4, "0;32"],
  E: [101, 69, 5, "0;18"],
  F: [102, 70, 6, "0;33"],
  G: [103, 71, 7, "0;34"],
  H: [104, 72, 8, "0;35"],
  I: [105, 73, 9, "0;23"],
  J: [106, 74, 10, "0;36"],
  K: [107, 75, 11, "0;37"],
  L: [108, 76, 12, "0;38"],
  M: [109, 77, 13, "0;50"],
  N: [110, 78, 14, "0;49"],
  O: [111, 79, 15, "0;24"],
  P: [112, 80, 16, "0;25"],
  Q: [113, 81, 17, "0;16"],
  R: [114, 82, 18, "0;19"],
  S: [115, 83, 19, "0;31"],
  T: [116, 84, 20, "0;20"],
  U: [117, 85, 21, "0;22"],
  V: [118, 86, 22, "0;47"],
  W: [119, 87, 23, "0;17"],
  X: [120, 88, 24, "0;45"],
  Y: [121, 89, 25, "0;21"],
  Z: [122, 90, 26, "0;44"],
  "1": [49, 33, null, "0;120"],
  "2": [50, 64, 0, "0;121"],
  "3": [51, 35, null, "0;122"],
  "4": [52, 36, null, "0;123"],
  "5": [53, 37, null, "0;124"],
  "6": [54, 94, 30, "0;125"],
  "7": [55, 38, null, "0;126"],
  "8": [56, 42, null, "0;126"],
  "9": [57, 40, null, "0;127"],
  "0": [48, 41, null, "0;129"],
  "-": [45, 95, 31, "0;130"],
  "=": [61, 43, null, "0;131"],
  "[": [91, 123, 27, "0;26"],
  "]": [93, 125, 29, "0;27"],
  "\\": [92, 124, 28, "0;43"],
  ";": [59, 58, null, "0;39"],
  "'": [39, 34, null, "0;40"],
  ",": [44, 60, null, "0;51"],
  ".": [46, 62, null, "0;52"],
  "/": [47, 63, null, "0;53"],
  "`": [96, 126, null, "0;41"],
  ENTER_keypad: [13, null, 10, "0;166"],
  "/_keypad": [47, 47, "0;142", "0;74"],
  "*_keypad": [42, "0;144", "0;78", null],
  "-_keypad": [45, 45, "0;149", "0;164"],
  "+_keypad": [43, 43, "0;150", "0;55"],
  "5_keypad": ["0;76", 53, "0;143", null],
} as const;
export type ConsoleKeyboardCodes = Exclude<(typeof ConsoleKeyboardCodes)[keyof typeof ConsoleKeyboardCodes][number], null>;
const redefineConsoleKeyboard = (code: ConsoleKeyboardCodes, result: RangeTuple<0, 128>[number] | string) => {
  return CSI(`${code};${typeof result === "string" ? `"${result}"` : result}p`);
};

const setScrollRegion = (top: number, bottom: number) => {
  return CSI(`${top};${bottom}r`);
};

export const escapes = {
  BEL,
  BS,
  HT,
  LF,
  VT,
  FF,
  CR,
  ESC,
  DEL,
  CSI,
  DCS,
  OSC,
  cursor: ConsoleCursor,
  erase: ConsoleErase,
  format: Object.assign(consoleFormat, {
    reset: ConsoleFormatResetModes,
    modes: ConsoleFormatModes,
    colors: ConsoleFormatColors,
  }),
  screen: {
    modes: ConsoleScreenModes,
    wrappong: ConsoleScreenWrapping,
    private: ConsolePrivateScreenModes,
  },
  ketboard: {
    keys: ConsoleKeyboardCodes,
    redefine: redefineConsoleKeyboard,
  },
  regions: {
    set: setScrollRegion,
  },
};
