import type { ConsoleFormat } from "./escapes";
import { escapes } from "./escapes";

export const ConsoleFormats = {
  ...escapes.format.modes,
  ...escapes.format.colors["4bit"].pairs,
} as const;
export type ConsoleFormatNames = keyof typeof ConsoleFormats;
export type ConsoleFormats = ConsoleFormatNames | (ConsoleFormatNames | readonly [number, number] | readonly [string, string])[];

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
  let groupIndex = -1;
  const lGroups = [] as Array<Extract<ConsoleFormat, number>[] | string>;
  const rGroups = [] as Array<Extract<ConsoleFormat, number>[] | string>;
  for (let index = 0; index < _formats.length; index += 1) {
    const [l, r] = _formats[index] as [Extract<ConsoleFormat, number>, Extract<ConsoleFormat, number>] | [string, string];
    if (typeof l === "string") {
      if (typeof lGroups[groupIndex] !== "string") {
        groupIndex += 1;
        lGroups[groupIndex] = "";
        rGroups[groupIndex] = "";
      }
      (lGroups[groupIndex] as string) += l;
      (rGroups[groupIndex] as string) = r + (rGroups[groupIndex] as string);
    } else {
      if (!Array.isArray(lGroups[groupIndex])) {
        groupIndex += 1;
        lGroups[groupIndex] = [];
        rGroups[groupIndex] = [];
      }
      (lGroups[groupIndex] as number[]).push(l);
      (rGroups[groupIndex] as number[]).unshift(r);
    }
  }
  const left = lGroups.map((group) => (typeof group === "string" ? group : escapes.format(...group)));
  const right = rGroups.reverse().map((group) => (typeof group === "string" ? group : escapes.format(...group)));
  return `${left.join("")}${text}${right.join("")}`;
}
