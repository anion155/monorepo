import { createErrorClass } from "../errors";

export class InvalidGlobPattern extends createErrorClass("InvalidGlobPattern", "invalid glob pattern") {
  constructor(
    message: string,
    readonly pattern: string,
    readonly index: number,
  ) {
    super(message);
  }

  toString(tab: string = "") {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return `${super.toString()}:\n${tab}${this.pattern}\n${tab}${Array.from({ length: this.index }, () => " ").join("")}^`;
  }
}

type GlobToken =
  | { type: "character"; code: number }
  | { type: "sequence" }
  | { type: "deep" }
  | { type: "include"; codes: Set<number> }
  | { type: "exclude"; codes: Set<number> };

const classnames = (() => {
  function createRange(from: string, to: string) {
    let result = "";
    for (let code = from.charCodeAt(0), end = to.charCodeAt(0); code <= end; code += 1) {
      result += String.fromCharCode(code);
    }
    return result;
  }
  const digit = createRange("0", "9");
  const lower = createRange("a", "z");
  const upper = createRange("A", "Z");
  return {
    alnum: digit + lower + upper,
    alpha: lower + upper,
    digit,
    lower,
    upper,
    space: " \t\n\v\f\r",
    punct: "!\"#$%&'()*+,-./:;<=>?@[\\]^_{|}~",
    xdigit: digit + createRange("a", "f") + createRange("A", "F"),
  };
})();
function tokenizeGlobClassname(pattern: string, index: number) {
  const classnameStart = index;
  index += 1;
  if (pattern[index] !== ":") {
    throw new InvalidGlobPattern("use escape sequence instead to indicate '[' as symbol", pattern, classnameStart);
  }
  index += 1;
  let classname = "";
  while (index < pattern.length) {
    if (pattern[index] === ":") {
      index += 1;
      if (pattern[index] !== "]") throw new InvalidGlobPattern("classname must be wrapped in [:<name>:]", pattern, classnameStart);
      break;
    }
    classname += pattern[index];
    index += 1;
  }
  if (pattern[index] === undefined) throw new InvalidGlobPattern("classname must be wrapped in [:<name>:]", pattern, classnameStart);
  const symbols = classnames[classname as never] as string | undefined;
  if (symbols === undefined) throw new InvalidGlobPattern(`unknown classname used: "${classname}"`, pattern, classnameStart);
  index += 1;

  return { symbols, index };
}

function tokenizeGlobBrackets(pattern: string, index: number) {
  const bracketsStart = index;
  index += 1;
  let type: "include" | "exclude" = "include";
  if (pattern[index] === "!") {
    type = "exclude";
    index += 1;
  }
  if (pattern[index] === undefined) {
    throw new InvalidGlobPattern("bracket must be enclosed", pattern, bracketsStart);
  }
  const codes = new Set<number>();
  function handleRange(from: number) {
    const rangePos = index;
    if (pattern[index] !== "-") return;
    index += 1;
    if (pattern[index] === "]") {
      codes.add("-".charCodeAt(0));
      return;
    }
    if (pattern[index] === "[") {
      throw new InvalidGlobPattern("use escape sequence instead to indicate '[' as last symbol in range", pattern, rangePos);
    }
    if (pattern[index] === "\\") {
      index += 1;
    }
    if (pattern[index] === undefined) {
      throw new InvalidGlobPattern("bracket must be enclosed", pattern, bracketsStart);
    }
    const to = pattern.charCodeAt(index);
    for (let code = from + 1; code <= to; code += 1) codes.add(code);
  }
  while (index < pattern.length) {
    if (pattern[index] === "\\") {
      index += 1;
      if (pattern[index] === undefined) throw new InvalidGlobPattern("escape can not be finishing character", pattern, index - 1);
      const code = pattern.charCodeAt(index);
      codes.add(code);
      index += 1;
      handleRange(code);
    } else if (pattern[index] === "[") {
      let symbols: string;
      ({ symbols, index } = tokenizeGlobClassname(pattern, index));
      for (let symbolIndex = 0; symbolIndex < symbols.length; symbolIndex += 1) {
        codes.add(symbols.charCodeAt(symbolIndex));
      }
    } else if (pattern[index] === "]") {
      if (index - bracketsStart <= 1) {
        codes.add(pattern.charCodeAt(index));
      } else {
        index += 1;
        break;
      }
    } else {
      const code = pattern.charCodeAt(index);
      codes.add(code);
      index += 1;
      handleRange(code);
    }
  }
  if (pattern[index] === undefined) throw new InvalidGlobPattern("bracket must be enclosed", pattern, bracketsStart);
  return { token: { type, codes } as Extract<GlobToken, { type: "include" | "exclude" }>, index };
}

function tokenizeGlob(pattern: string, separator: string): ReadonlyArray<ReadonlyArray<Readonly<GlobToken>>> {
  const tokens = [[]] as GlobToken[][];
  let tokensIndex = 0;
  let index = 0;
  while (index < pattern.length) {
    if (pattern[index] === separator) {
      tokensIndex += 1;
      tokens[tokensIndex] = [];
      index += 1;
    } else if (pattern[index] === "\\") {
      index += 1;
      if (pattern[index] === undefined) throw new InvalidGlobPattern("escape can not be finishing character", pattern, index - 1);
      tokens[tokensIndex].push({ type: "character", code: pattern.charCodeAt(index) });
      index += 1;
    } else if (pattern[index] === "?") {
      tokens[tokensIndex].push({ type: "exclude", codes: new Set() });
      index += 1;
    } else if (pattern[index] === "[") {
      let token: GlobToken;
      ({ token, index } = tokenizeGlobBrackets(pattern, index));
      tokens[tokensIndex].push(token);
    } else if (pattern[index] === "*") {
      index += 1;
      if (pattern[index] === "*") {
        tokens[tokensIndex].push({ type: "deep" });
        index += 1;
      } else {
        tokens[tokensIndex].push({ type: "sequence" });
      }
    } else {
      tokens[tokensIndex].push({ type: "character", code: pattern.charCodeAt(index) });
      index += 1;
    }
  }
  if (!tokens.every((tokens) => tokens.every((token) => token.type !== "deep") || tokens.length === 1)) {
    throw new InvalidGlobPattern("deep sequence must be one and only token on level", pattern, index - 1);
  }
  tokens.reduce((prev, tokens, index) => {
    const curr = tokens.length === 1 && tokens[0].type === "deep";
    if (prev && curr) throw new InvalidGlobPattern("deep sequence can not follow after another deep sequence", pattern, index - 1);
    return curr;
  }, false);
  return tokens;
}

/**
 * shell-style pattern matching.
 *
 * Globbing characters (wildcards) are special characters used to perform pattern matching of strings.
 * A glob pattern is a word containing one or more unquoted ‘?’ or ‘*’ characters, or “[..]” sequences.
 *
 * The pattern elements have the following meaning:
 * ?      Matches any single character.
 * *      Matches any sequence of zero or more characters.
 * [..]   Matches any of the characters inside the brackets. Ranges of characters can be specified by
 *        separating two characters by a ‘-’ (e.g. “[a0-9]” matches the letter ‘a’ or any digit).
 *        In order to represent itself, a ‘-’ must either be quoted or the first or last character in
 *        the character list. Similarly, a ‘]’ must be quoted or the first character in the list if it
 *        is to represent itself instead of the end of the list. Also, a ‘!’ appearing at the start of
 *        the list has special meaning (see below), so to represent itself it must be quoted or appear
 *        later in the list.
 *        Within a bracket expression, the name of a character class enclosed in ‘[:’ and ‘:]’ stands
 *        for the list of all characters belonging to that class. Supported character classes:
 *          alnum	cntrl	lower	space
 *          alpha	digit	print	upper
 *          blank	graph	punct	xdigit
 * [!..]  Like [..], except it matches any character not inside the brackets.
 * \\     Matches the character following it verbatim. This is useful to quote the special
 *        characters ‘?’, ‘*’, ‘[’, and ‘\’ such that they lose their special meaning. For example,
 *        the pattern “\\\*\[x]\?” matches the string “\*[x]?”.
 *
 * @example
 * // Match all `.js` files
 * ["index.js", "style.css", "app.ts"].filter(glob("*.js")) // Output: ["index.js"]
 * // Match files with exactly one character before `.txt`
 * ["a.txt", "ab.txt", "c.txt"].filter(glob("?.txt")) // Output: ["a.txt", "c.txt"]
 * // Match files starting with "file" and ending with any extension
 * ["file.txt", "file.js", "test.txt"].filter(glob("file.*")) // Output: ["file.txt", "file.js"]
 * // Match files with numbers in their names
 * ["file1.txt", "fileA.txt", "file2.js"].filter(glob("file[0-9].*")) // Output: ["file1.txt", "file2.js"]
 * // Match files that do NOT have numbers in their names
 * ["file1.txt", "fileA.txt", "fileB.js"].filter(glob("file[!0-9].*")) // Output: ["fileA.txt", "fileB.js"]
 * // Match files with specific character classes
 * ["file1.txt", "fileA.txt", "file2.js"].filter(glob("file[:digit:].*")) // Output: ["file1.txt", "file2.js"]
 * // Match files with escaped special characters
 * ["file?.txt", "fileA.txt"].filter(glob("file\\?.txt")) // Output: ["file?.txt"]
 */
export function glob(pattern: string, separator: string = "/") {
  const tokens = tokenizeGlob(pattern, separator);
  Object.freeze(tokens);
  Object.preventExtensions(tokens);
  function execLevel(value: string, tokens: ReadonlyArray<Readonly<Exclude<GlobToken, { type: "deep" }>>>) {
    let tokenIndex = 0;
    let valueIndex = 0;
    while (tokenIndex < tokens.length) {
      if (value[valueIndex] === undefined) return false;
      const token = tokens[tokenIndex];
      if (token.type === "character") {
        if (value.charCodeAt(valueIndex) !== token.code) return false;
      } else if (token.type === "include") {
        if (!token.codes.has(value.charCodeAt(valueIndex))) return false;
      } else if (token.type === "exclude") {
        if (token.codes.has(value.charCodeAt(valueIndex))) return false;
      } else if (token.type === "sequence") {
        while (valueIndex < value.length) {
          if (execLevel(value.substring(valueIndex), tokens.slice(tokenIndex + 1))) return true;
          valueIndex += 1;
        }
        return false;
      }
      tokenIndex += 1;
      valueIndex += 1;
    }
    return true;
  }
  function execLevels(levels: string[], tokens: ReadonlyArray<ReadonlyArray<GlobToken>>) {
    let levelIndex = 0;
    let tokenIndex = 0;
    while (levelIndex < levels.length) {
      if (tokens[tokenIndex] === undefined) return false;
      if (tokens[tokenIndex].length === 1 && tokens[tokenIndex][0].type === "deep") {
        while (levelIndex < levels.length) {
          if (execLevels(levels.slice(levelIndex), tokens.slice(tokenIndex + 1))) return true;
          levelIndex += 1;
        }
        return false;
      }
      if (!execLevel(levels[levelIndex], tokens[tokenIndex] as never)) return false;
      levelIndex += 1;
      tokenIndex += 1;
    }
    return true;
  }
  function execGlob(value: string) {
    return execLevels(value.split(separator), tokens);
  }
  execGlob.tokens = tokens;
  Object.defineProperty(execGlob, "tokens", { writable: false });
  return execGlob;
}
