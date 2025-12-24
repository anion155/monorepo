import type { ConsoleFormat } from "./escapes";
import { escapes } from "./escapes";

export const ConsoleFormats = {
  ...escapes.format.modes,

  fgBlack: [escapes.format.colors["4bit"].fgBlack, escapes.format.colors["4bit"].fgDefault],
  fgRed: [escapes.format.colors["4bit"].fgRed, escapes.format.colors["4bit"].fgDefault],
  fgGreen: [escapes.format.colors["4bit"].fgGreen, escapes.format.colors["4bit"].fgDefault],
  fgYellow: [escapes.format.colors["4bit"].fgYellow, escapes.format.colors["4bit"].fgDefault],
  fgBlue: [escapes.format.colors["4bit"].fgBlue, escapes.format.colors["4bit"].fgDefault],
  fgMagenta: [escapes.format.colors["4bit"].fgMagenta, escapes.format.colors["4bit"].fgDefault],
  fgCyan: [escapes.format.colors["4bit"].fgCyan, escapes.format.colors["4bit"].fgDefault],
  fgWhite: [escapes.format.colors["4bit"].fgWhite, escapes.format.colors["4bit"].fgDefault],

  bgBlack: [escapes.format.colors["4bit"].bgBlack, escapes.format.colors["4bit"].bgDefault],
  bgRed: [escapes.format.colors["4bit"].bgRed, escapes.format.colors["4bit"].bgDefault],
  bgGreen: [escapes.format.colors["4bit"].bgGreen, escapes.format.colors["4bit"].bgDefault],
  bgYellow: [escapes.format.colors["4bit"].bgYellow, escapes.format.colors["4bit"].bgDefault],
  bgBlue: [escapes.format.colors["4bit"].bgBlue, escapes.format.colors["4bit"].bgDefault],
  bgMagenta: [escapes.format.colors["4bit"].bgMagenta, escapes.format.colors["4bit"].bgDefault],
  bgCyan: [escapes.format.colors["4bit"].bgCyan, escapes.format.colors["4bit"].bgDefault],
  bgWhite: [escapes.format.colors["4bit"].bgWhite, escapes.format.colors["4bit"].bgDefault],

  fgBrBlack: [escapes.format.colors["4bit"].fgBrBlack, escapes.format.colors["4bit"].fgDefault],
  fgBrRed: [escapes.format.colors["4bit"].fgBrRed, escapes.format.colors["4bit"].fgDefault],
  fgBrGreen: [escapes.format.colors["4bit"].fgBrGreen, escapes.format.colors["4bit"].fgDefault],
  fgBrYellow: [escapes.format.colors["4bit"].fgBrYellow, escapes.format.colors["4bit"].fgDefault],
  fgBrBlue: [escapes.format.colors["4bit"].fgBrBlue, escapes.format.colors["4bit"].fgDefault],
  fgBrMagenta: [escapes.format.colors["4bit"].fgBrMagenta, escapes.format.colors["4bit"].fgDefault],
  fgBrCyan: [escapes.format.colors["4bit"].fgBrCyan, escapes.format.colors["4bit"].fgDefault],
  fgBrWhite: [escapes.format.colors["4bit"].fgBrWhite, escapes.format.colors["4bit"].fgDefault],

  bgBrBlack: [escapes.format.colors["4bit"].bgBrBlack, escapes.format.colors["4bit"].bgDefault],
  bgBrRed: [escapes.format.colors["4bit"].bgBrRed, escapes.format.colors["4bit"].bgDefault],
  bgBrGreen: [escapes.format.colors["4bit"].bgBrGreen, escapes.format.colors["4bit"].bgDefault],
  bgBrYellow: [escapes.format.colors["4bit"].bgBrYellow, escapes.format.colors["4bit"].bgDefault],
  bgBrBlue: [escapes.format.colors["4bit"].bgBrBlue, escapes.format.colors["4bit"].bgDefault],
  bgBrMagenta: [escapes.format.colors["4bit"].bgBrMagenta, escapes.format.colors["4bit"].bgDefault],
  bgBrCyan: [escapes.format.colors["4bit"].bgBrCyan, escapes.format.colors["4bit"].bgDefault],
  bgBrWhite: [escapes.format.colors["4bit"].bgBrWhite, escapes.format.colors["4bit"].bgDefault],

  black: [escapes.format.colors["4bit"].fgBlack, escapes.format.colors["4bit"].fgDefault],
  red: [escapes.format.colors["4bit"].fgRed, escapes.format.colors["4bit"].fgDefault],
  green: [escapes.format.colors["4bit"].fgGreen, escapes.format.colors["4bit"].fgDefault],
  yellow: [escapes.format.colors["4bit"].fgYellow, escapes.format.colors["4bit"].fgDefault],
  blue: [escapes.format.colors["4bit"].fgBlue, escapes.format.colors["4bit"].fgDefault],
  magenta: [escapes.format.colors["4bit"].fgMagenta, escapes.format.colors["4bit"].fgDefault],
  cyan: [escapes.format.colors["4bit"].fgCyan, escapes.format.colors["4bit"].fgDefault],
  white: [escapes.format.colors["4bit"].fgWhite, escapes.format.colors["4bit"].fgDefault],
  gray: [escapes.format.colors["4bit"].fgBrBlack, escapes.format.colors["4bit"].fgDefault],
  grey: [escapes.format.colors["4bit"].fgBrBlack, escapes.format.colors["4bit"].fgDefault],
  bgGray: [escapes.format.colors["4bit"].bgBrBlack, escapes.format.colors["4bit"].fgDefault],
  bgGrey: [escapes.format.colors["4bit"].bgBrBlack, escapes.format.colors["4bit"].fgDefault],
} as const;
export type ConsoleFormatNames = keyof typeof ConsoleFormats;

/** Formats {@link text} using {@link ConsoleFormats}. */
export function applyConsoleFormat(formats: ConsoleFormatNames | (ConsoleFormatNames | readonly [number, number])[], text: string) {
  // {
  //   if (process.env.FORCE_COLOR !== undefined) {
  //     return lazyInternalTTY().getColorDepth() > 2;
  //   }
  //   return stream?.isTTY && (
  //     typeof stream.getColorDepth === 'function' ?
  //       stream.getColorDepth() > 2 : true);
  // }

  const _formats = Array.isArray(formats)
    ? formats.map((format) => (typeof format === "string" ? ConsoleFormats[format] : format))
    : [ConsoleFormats[formats]];
  const left = [] as Extract<ConsoleFormat, number>[];
  const right = [] as Extract<ConsoleFormat, number>[];
  for (let index = 0; index < _formats.length; index += 1) {
    const [l, r] = _formats[index] as [Extract<ConsoleFormat, number>, Extract<ConsoleFormat, number>];
    left.push(l);
    right.unshift(r);
  }
  return `${escapes.format(...left)}${text}${escapes.format(...right)}`;
}
