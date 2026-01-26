import type { ConsoleFormat } from "./escapes";
import { escapes } from "./escapes";

export const ConsoleFormats = {
  ...escapes.format.modes,
  ...escapes.format.colors["4bit"].pairs,
} as const;
export type ConsoleFormatNames = keyof typeof ConsoleFormats;
export type ConsoleFormats = ConsoleFormatNames | (ConsoleFormatNames | readonly [number, number] | readonly [string, string])[];

const CHAR_0 = "0".charCodeAt(0);
const CHAR_9 = "9".charCodeAt(0);
const CHAR_SEMI = ";".charCodeAt(0);
const CHAR_m = "m".charCodeAt(0);

/** Formats {@link text} using {@link formats}. */
export function applyConsoleFormat(formats: ConsoleFormats, text: string, disabled: boolean = !process.stdout.isTTY) {
  if (disabled) return text;
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
      text = text.replaceAll(r, `${r}${l}`);
    } else {
      if (!Array.isArray(lGroups[groupIndex])) {
        groupIndex += 1;
        lGroups[groupIndex] = [];
        rGroups[groupIndex] = [];
      }
      (lGroups[groupIndex] as number[]).push(l);
      (rGroups[groupIndex] as number[]).unshift(r);
      // FIXME: refactor into ansi ast parser
      const ast: Array<string | number[]> = [];
      let last = 0;
      let index = 0;
      visitor: while (true) {
        index = text.indexOf(escapes.CSI.value, index);
        if (index < 0) {
          ast.push(text.substring(last));
          break visitor;
        }
        const start = index;
        index += escapes.CSI.value.length;
        let found = false;
        const params: number[] = [];
        const parseParam = () => {
          let param: number | undefined;
          paramParser: while (true) {
            const char = text.charCodeAt(index);
            if (char < CHAR_0 || char > CHAR_9) break paramParser;
            if (param === undefined) param = 0;
            param = param * 10 + (char - CHAR_0);
            index += 1;
          }
          return param;
        };
        parser: while (true) {
          const param = parseParam();
          if (param === undefined) break parser;
          params.push(param);
          switch (text.charCodeAt(index)) {
            case CHAR_SEMI:
              index += 1;
              break;
            case CHAR_m:
              found = true;
              index += 1;
              break parser;
            default:
              index += 1;
              break parser;
          }
        }
        if (!found) continue visitor;
        if (!params.includes(r)) continue visitor;
        ast.push(text.substring(last, start));
        last = index;
        params.push(l);
        ast.push(params);
      }
      text = ast.reduce<string>((acc, item) => `${acc}${typeof item === "string" ? item : escapes.format(...(item as ConsoleFormat[]))}`, "");
    }
  }
  const left = lGroups.map((group) => (typeof group === "string" ? group : escapes.format(...group)));
  const right = rGroups.reverse().map((group) => (typeof group === "string" ? group : escapes.format(...group)));
  return `${left.join("")}${text}${right.join("")}`;
}
