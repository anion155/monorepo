import type { ConsoleFormat } from "./escapes";
import { escapes } from "./escapes";

export const ConsoleFormats = {
  ...escapes.format.modes,
  ...escapes.format.colors["4bit"].pairs,
} as const;
export type ConsoleFormatNames = keyof typeof ConsoleFormats;
export type ConsoleFormats = ConsoleFormatNames | (ConsoleFormatNames | readonly [number, number])[];

/** Formats {@link text} using {@link ConsoleFormats}. */
export function applyConsoleFormat(formats: ConsoleFormats, text: string) {
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
