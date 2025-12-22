import type { ConsoleFormat } from "./escapes";
import {
  consoleFormat,
  ConsoleFormat4bBackgroundBrightColors,
  ConsoleFormat4bBackgroundColors,
  ConsoleFormat4bForegroundBrightColors,
  ConsoleFormat4bForegroundColors,
  ConsoleFormatModes,
} from "./escapes";

const Formats = {
  ...ConsoleFormatModes,

  fgBlack: [ConsoleFormat4bForegroundColors.fgBlack, ConsoleFormat4bForegroundColors.fgDefault],
  fgRed: [ConsoleFormat4bForegroundColors.fgRed, ConsoleFormat4bForegroundColors.fgDefault],
  fgGreen: [ConsoleFormat4bForegroundColors.fgGreen, ConsoleFormat4bForegroundColors.fgDefault],
  fgYellow: [ConsoleFormat4bForegroundColors.fgYellow, ConsoleFormat4bForegroundColors.fgDefault],
  fgBlue: [ConsoleFormat4bForegroundColors.fgBlue, ConsoleFormat4bForegroundColors.fgDefault],
  fgMagenta: [ConsoleFormat4bForegroundColors.fgMagenta, ConsoleFormat4bForegroundColors.fgDefault],
  fgCyan: [ConsoleFormat4bForegroundColors.fgCyan, ConsoleFormat4bForegroundColors.fgDefault],
  fgWhite: [ConsoleFormat4bForegroundColors.fgWhite, ConsoleFormat4bForegroundColors.fgDefault],

  bgBlack: [ConsoleFormat4bBackgroundColors.bgBlack, ConsoleFormat4bBackgroundColors.bgDefault],
  bgRed: [ConsoleFormat4bBackgroundColors.bgRed, ConsoleFormat4bBackgroundColors.bgDefault],
  bgGreen: [ConsoleFormat4bBackgroundColors.bgGreen, ConsoleFormat4bBackgroundColors.bgDefault],
  bgYellow: [ConsoleFormat4bBackgroundColors.bgYellow, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBlue: [ConsoleFormat4bBackgroundColors.bgBlue, ConsoleFormat4bBackgroundColors.bgDefault],
  bgMagenta: [ConsoleFormat4bBackgroundColors.bgMagenta, ConsoleFormat4bBackgroundColors.bgDefault],
  bgCyan: [ConsoleFormat4bBackgroundColors.bgCyan, ConsoleFormat4bBackgroundColors.bgDefault],
  bgWhite: [ConsoleFormat4bBackgroundColors.bgWhite, ConsoleFormat4bBackgroundColors.bgDefault],

  fgBrBlack: [ConsoleFormat4bForegroundBrightColors.fgBrBlack, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrRed: [ConsoleFormat4bForegroundBrightColors.fgBrRed, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrGreen: [ConsoleFormat4bForegroundBrightColors.fgBrGreen, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrYellow: [ConsoleFormat4bForegroundBrightColors.fgBrYellow, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrBlue: [ConsoleFormat4bForegroundBrightColors.fgBrBlue, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrMagenta: [ConsoleFormat4bForegroundBrightColors.fgBrMagenta, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrCyan: [ConsoleFormat4bForegroundBrightColors.fgBrCyan, ConsoleFormat4bForegroundColors.fgDefault],
  fgBrWhite: [ConsoleFormat4bForegroundBrightColors.fgBrWhite, ConsoleFormat4bForegroundColors.fgDefault],

  bgBrBlack: [ConsoleFormat4bBackgroundBrightColors.bgBrBlack, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrRed: [ConsoleFormat4bBackgroundBrightColors.bgBrRed, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrGreen: [ConsoleFormat4bBackgroundBrightColors.bgBrGreen, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrYellow: [ConsoleFormat4bBackgroundBrightColors.bgBrYellow, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrBlue: [ConsoleFormat4bBackgroundBrightColors.bgBrBlue, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrMagenta: [ConsoleFormat4bBackgroundBrightColors.bgBrMagenta, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrCyan: [ConsoleFormat4bBackgroundBrightColors.bgBrCyan, ConsoleFormat4bBackgroundColors.bgDefault],
  bgBrWhite: [ConsoleFormat4bBackgroundBrightColors.bgBrWhite, ConsoleFormat4bBackgroundColors.bgDefault],
} as const;
export type FormatNames = keyof typeof Formats;

export function applyConsoleFormat(formats: FormatNames | (FormatNames | readonly [number, number])[], text: string) {
  const _formats = Array.isArray(formats) ? formats.map((format) => (typeof format === "string" ? Formats[format] : format)) : [Formats[formats]];
  const left = [] as Extract<ConsoleFormat, number>[];
  const right = [] as Extract<ConsoleFormat, number>[];
  for (let index = 0; index < _formats.length; index += 1) {
    const [l, r] = _formats[index] as [Extract<ConsoleFormat, number>, Extract<ConsoleFormat, number>];
    left.push(l);
    right.unshift(r);
  }
  return `${consoleFormat(...left)}${text}${consoleFormat(...right)}`;
}
