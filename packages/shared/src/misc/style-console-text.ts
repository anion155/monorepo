const ansi = (open: number, close: number) => [`\u001B[${open}m`, `\u001B[${close}m`];

const defaultFG = 39;
const defaultBG = 49;

export const ConsoleEscapeModifiers = {
  reset: ansi(0, 0),
  bold: ansi(1, 22),
  italic: ansi(3, 23),
  underline: ansi(4, 24),
  strikethrough: ansi(9, 29),
  hidden: ansi(8, 28),
  dim: ansi(2, 22),
  overlined: ansi(53, 55),
  blink: ansi(5, 25),
  inverse: ansi(7, 27),
  doubleunderline: ansi(21, 24),
  framed: ansi(51, 54),
};
export type ConsoleEscapeModifiers = keyof typeof ConsoleEscapeModifiers;

export const ConsoleEscapeForeground = {
  black: ansi(30, defaultFG),
  red: ansi(31, defaultFG),
  green: ansi(32, defaultFG),
  yellow: ansi(33, defaultFG),
  blue: ansi(34, defaultFG),
  magenta: ansi(35, defaultFG),
  cyan: ansi(36, defaultFG),
  white: ansi(37, defaultFG),
  gray: ansi(90, defaultFG),
  grey: ansi(90, defaultFG),
  blackBright: ansi(90, defaultFG),
  redBright: ansi(91, defaultFG),
  greenBright: ansi(92, defaultFG),
  yellowBright: ansi(93, defaultFG),
  blueBright: ansi(94, defaultFG),
  magentaBright: ansi(95, defaultFG),
  cyanBright: ansi(96, defaultFG),
  whiteBright: ansi(97, defaultFG),
};
export type ConsoleEscapeForeground = keyof typeof ConsoleEscapeForeground;

export const ConsoleEscapeBackground = {
  bgBlack: ansi(40, defaultBG),
  bgRed: ansi(41, defaultBG),
  bgGreen: ansi(42, defaultBG),
  bgYellow: ansi(43, defaultBG),
  bgBlue: ansi(44, defaultBG),
  bgMagenta: ansi(45, defaultBG),
  bgCyan: ansi(46, defaultBG),
  bgWhite: ansi(47, defaultBG),
  bgGray: ansi(100, defaultBG),
  bgGrey: ansi(100, defaultBG),
  bgBlackBright: ansi(100, defaultBG),
  bgRedBright: ansi(101, defaultBG),
  bgGreenBright: ansi(102, defaultBG),
  bgYellowBright: ansi(103, defaultBG),
  bgBlueBright: ansi(104, defaultBG),
  bgMagentaBright: ansi(105, defaultBG),
  bgCyanBright: ansi(106, defaultBG),
  bgWhiteBright: ansi(107, defaultBG),
};
export type ConsoleEscapeBackground = keyof typeof ConsoleEscapeBackground;

export const ConsoleEscape = {
  ...ConsoleEscapeModifiers,
  ...ConsoleEscapeForeground,
  ...ConsoleEscapeBackground,
};
export type ConsoleEscape = keyof typeof ConsoleEscape;

export function styleConsoleText(format: ConsoleEscape | ConsoleEscape[], text: string) {
  const formats = Array.isArray(format) ? format : [format];
  let left = "";
  let right = "";
  for (const key of formats) {
    const [open, close] = ConsoleEscape[key];
    left += open;
    right = `${close}${right}`;
  }
  return `${left}${text}${right}`;
}
