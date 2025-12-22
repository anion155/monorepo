import type { ConsoleFormat } from "./escapes";
import { consoleFormat, ConsoleFormat4bColors, ConsoleFormatModes } from "./escapes";

export type FormatNames = keyof (typeof applyConsoleFormat)["formats"];
export function applyConsoleFormat(formats: FormatNames | (FormatNames | readonly [number, number])[], text: string) {
  const _formats = Array.isArray(formats)
    ? formats.map((format) => (typeof format === "string" ? applyConsoleFormat.formats[format] : format))
    : [applyConsoleFormat.formats[formats]];
  const left = [] as Extract<ConsoleFormat, number>[];
  const right = [] as Extract<ConsoleFormat, number>[];
  for (let index = 0; index < _formats.length; index += 1) {
    const [l, r] = _formats[index] as [Extract<ConsoleFormat, number>, Extract<ConsoleFormat, number>];
    left.push(l);
    right.unshift(r);
  }
  return `${consoleFormat(...left)}${text}${consoleFormat(...right)}`;
}
applyConsoleFormat.formats = {
  bold: ConsoleFormatModes.bold,
  dim: ConsoleFormatModes.dim,
  italic: ConsoleFormatModes.italic,
  underline: ConsoleFormatModes.underline,
  doubleUnderline: ConsoleFormatModes.doubleUnderline,
  blinking: ConsoleFormatModes.blinking,
  inverse: ConsoleFormatModes.inverse,
  invisible: ConsoleFormatModes.invisible,
  strikethrough: ConsoleFormatModes.strikethrough,
  framed: ConsoleFormatModes.framed,
  overline: ConsoleFormatModes.overline,

  fgBlack: [ConsoleFormat4bColors.fgBlack, ConsoleFormat4bColors.fgDefault],
  fgRed: [ConsoleFormat4bColors.fgRed, ConsoleFormat4bColors.fgDefault],
  fgGreen: [ConsoleFormat4bColors.fgGreen, ConsoleFormat4bColors.fgDefault],
  fgYellow: [ConsoleFormat4bColors.fgYellow, ConsoleFormat4bColors.fgDefault],
  fgBlue: [ConsoleFormat4bColors.fgBlue, ConsoleFormat4bColors.fgDefault],
  fgMagenta: [ConsoleFormat4bColors.fgMagenta, ConsoleFormat4bColors.fgDefault],
  fgCyan: [ConsoleFormat4bColors.fgCyan, ConsoleFormat4bColors.fgDefault],
  fgWhite: [ConsoleFormat4bColors.fgWhite, ConsoleFormat4bColors.fgDefault],

  bgBlack: [ConsoleFormat4bColors.bgBlack, ConsoleFormat4bColors.bgDefault],
  bgRed: [ConsoleFormat4bColors.bgRed, ConsoleFormat4bColors.bgDefault],
  bgGreen: [ConsoleFormat4bColors.bgGreen, ConsoleFormat4bColors.bgDefault],
  bgYellow: [ConsoleFormat4bColors.bgYellow, ConsoleFormat4bColors.bgDefault],
  bgBlue: [ConsoleFormat4bColors.bgBlue, ConsoleFormat4bColors.bgDefault],
  bgMagenta: [ConsoleFormat4bColors.bgMagenta, ConsoleFormat4bColors.bgDefault],
  bgCyan: [ConsoleFormat4bColors.bgCyan, ConsoleFormat4bColors.bgDefault],
  bgWhite: [ConsoleFormat4bColors.bgWhite, ConsoleFormat4bColors.bgDefault],

  fgBrBlack: [ConsoleFormat4bColors.fgBrBlack, ConsoleFormat4bColors.fgDefault],
  fgBrRed: [ConsoleFormat4bColors.fgBrRed, ConsoleFormat4bColors.fgDefault],
  fgBrGreen: [ConsoleFormat4bColors.fgBrGreen, ConsoleFormat4bColors.fgDefault],
  fgBrYellow: [ConsoleFormat4bColors.fgBrYellow, ConsoleFormat4bColors.fgDefault],
  fgBrBlue: [ConsoleFormat4bColors.fgBrBlue, ConsoleFormat4bColors.fgDefault],
  fgBrMagenta: [ConsoleFormat4bColors.fgBrMagenta, ConsoleFormat4bColors.fgDefault],
  fgBrCyan: [ConsoleFormat4bColors.fgBrCyan, ConsoleFormat4bColors.fgDefault],
  fgBrWhite: [ConsoleFormat4bColors.fgBrWhite, ConsoleFormat4bColors.fgDefault],

  bgBrBlack: [ConsoleFormat4bColors.bgBrBlack, ConsoleFormat4bColors.bgDefault],
  bgBrRed: [ConsoleFormat4bColors.bgBrRed, ConsoleFormat4bColors.bgDefault],
  bgBrGreen: [ConsoleFormat4bColors.bgBrGreen, ConsoleFormat4bColors.bgDefault],
  bgBrYellow: [ConsoleFormat4bColors.bgBrYellow, ConsoleFormat4bColors.bgDefault],
  bgBrBlue: [ConsoleFormat4bColors.bgBrBlue, ConsoleFormat4bColors.bgDefault],
  bgBrMagenta: [ConsoleFormat4bColors.bgBrMagenta, ConsoleFormat4bColors.bgDefault],
  bgBrCyan: [ConsoleFormat4bColors.bgBrCyan, ConsoleFormat4bColors.bgDefault],
  bgBrWhite: [ConsoleFormat4bColors.bgBrWhite, ConsoleFormat4bColors.bgDefault],

  black: [ConsoleFormat4bColors.fgBlack, ConsoleFormat4bColors.fgDefault],
  red: [ConsoleFormat4bColors.fgRed, ConsoleFormat4bColors.fgDefault],
  green: [ConsoleFormat4bColors.fgGreen, ConsoleFormat4bColors.fgDefault],
  yellow: [ConsoleFormat4bColors.fgYellow, ConsoleFormat4bColors.fgDefault],
  blue: [ConsoleFormat4bColors.fgBlue, ConsoleFormat4bColors.fgDefault],
  magenta: [ConsoleFormat4bColors.fgMagenta, ConsoleFormat4bColors.fgDefault],
  cyan: [ConsoleFormat4bColors.fgCyan, ConsoleFormat4bColors.fgDefault],
  white: [ConsoleFormat4bColors.fgWhite, ConsoleFormat4bColors.fgDefault],
  gray: [ConsoleFormat4bColors.fgBrBlack, ConsoleFormat4bColors.fgDefault],
  grey: [ConsoleFormat4bColors.fgBrBlack, ConsoleFormat4bColors.fgDefault],
  bgGray: [ConsoleFormat4bColors.bgBrBlack, ConsoleFormat4bColors.fgDefault],
  bgGrey: [ConsoleFormat4bColors.bgBrBlack, ConsoleFormat4bColors.fgDefault],
} as const;
