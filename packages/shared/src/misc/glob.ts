import { createErrorClass } from "../errors";

export class InvalidGlobPattern extends createErrorClass("InvalidGlobPattern", "invalid glob pattern") {
  constructor(
    message: string,
    readonly pattern: string,
    readonly index: number,
  ) {
    super(message);
  }
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
 */
export function glob(wildcard: string, values: Iterable<string>) {
  let states = Iterator.from(values)
    .map((value) => [value, 0 as number] as [string, number])
    .toArray();
  let index = 0;
  function symbolsController() {
    let exclude = false;
    const symbols = new Set<number>();
    const addString = (characters: string) => {
      characters.split("").forEach((character) => symbols.add(character.charCodeAt(0)));
    };
    const addRange = (startCharacter: string, endCharacter: string) => {
      for (let code = startCharacter.charCodeAt(0), end = endCharacter.charCodeAt(0); code <= end; code += 1) {
        symbols.add(code);
      }
    };
    const merge = (controller: { exclude: boolean; symbols: Set<number> }) => {
      exclude ||= controller.exclude;
      controller.symbols.forEach((code) => symbols.add(code));
    };
    const run = () => {
      if (exclude) states = states.filter((state) => !symbols.has(state[0].charCodeAt(state[1])));
      else states = states.filter((state) => symbols.has(state[0].charCodeAt(state[1])));
    };
    return {
      get exclude() {
        return exclude;
      },
      set exclude(next: boolean) {
        exclude = next;
      },
      symbols,
      addString,
      addRange,
      merge,
      run,
    };
  }
  type SymbolsController = ReturnType<typeof symbolsController>;
  function globBrackets() {
    let bracketsStart = index;
    index += 1;

    const controller = symbolsController();
    if (wildcard[index] === "!") {
      controller.exclude = true;
      index += 1;
      bracketsStart += 1;
    }
    for (; index < wildcard.length; index += 1) {
      if (wildcard[index] === "\\") {
        controller.merge(globEscape());
      } else if (wildcard[index] === "[" && wildcard[index + 1] === ":") {
        index += 2;
        const classnameStart = index;
        let classname: string | undefined;
        for (; index < wildcard.length; index += 1) {
          if (wildcard[index] === "\\") index += 1;
          else if (wildcard[index] === ":") {
            index += 1;
            if (wildcard[index] !== "]") {
              throw new InvalidGlobPattern('classname must be enclosed with ":]" pattern', wildcard, classnameStart);
            }
            classname = wildcard.substring(classnameStart, index - 1);
            break;
          }
        }
        if (classname === undefined) throw new InvalidGlobPattern("classname isn't found", wildcard, classnameStart);
        else if (classname === "alnum") {
          controller.addRange("0", "9");
          controller.addRange("a", "z");
          controller.addRange("A", "Z");
        } else if (classname === "alpha") {
          controller.addRange("a", "z");
          controller.addRange("A", "Z");
        } else if (classname === "digit") {
          controller.addRange("0", "9");
        } else if (classname === "lower") {
          controller.addRange("a", "z");
        } else if (classname === "upper") {
          controller.addRange("A", "Z");
        } else if (classname === "space") {
          controller.addString(" \t\n\v\f\r");
        } else if (classname === "punct") {
          controller.addString("!\"#$%&'()*+,-./:;<=>?@[\\]^_{|}~");
        } else if (classname === "xdigit") {
          controller.addRange("0", "9");
          controller.addRange("a", "f");
          controller.addRange("A", "F");
        } else throw new InvalidGlobPattern(`unknown classname used: "${classname}"`, wildcard, classnameStart);
      } else if (wildcard[index] === "-") {
        index += 1;
        if (wildcard[index] === undefined) throw new InvalidGlobPattern("bracket must be enclosed", wildcard, bracketsStart);
        if (wildcard[index] === "]") {
          controller.symbols.add(wildcard.charCodeAt(index - 2));
          controller.symbols.add("-".charCodeAt(0));
          index -= 1;
          continue;
        }
        if (index - bracketsStart === 2) {
          controller.symbols.add("-".charCodeAt(0));
          controller.symbols.add(wildcard.charCodeAt(index));
          continue;
        }
        controller.addRange(wildcard[index - 2], wildcard[index]);
      } else if (wildcard[index] === "]") {
        break;
      } else {
        controller.symbols.add(wildcard.charCodeAt(index));
      }
    }
    if (index + 1 >= wildcard.length) throw new InvalidGlobPattern("bracket must be enclosed", wildcard, bracketsStart);
    return controller;
  }
  function globEscape() {
    index += 1;
    const controller = symbolsController();
    if (wildcard[index] === undefined) throw new InvalidGlobPattern("escape can't be finishing character", wildcard, index - 1);
    controller.symbols.add(wildcard.charCodeAt(index));
    return controller;
  }
  function globSymbol() {
    const controller = symbolsController();
    controller.symbols.add(wildcard.charCodeAt(index));
    return controller;
  }
  for (; index < wildcard.length; index += 1) {
    if (wildcard[index] === "\\") {
      globEscape().run();
    } else if (wildcard[index] === "*") {
      index += 1;
      if (wildcard[index] === "*") throw new InvalidGlobPattern("only nested glob supports double asterisks", wildcard, index);
      if (wildcard[index] === undefined) return states.map(([value]) => value);
      let controller: SymbolsController;
      if (wildcard[index] === "\\") controller = globEscape();
      else if (wildcard[index] === "[") controller = globBrackets();
      else controller = globSymbol();
      states = states.reduce(
        (acc, [value, index]) => {
          for (; index < value.length; index += 1) {
            const contains = controller.symbols.has(value.charCodeAt(index));
            if (controller.exclude ? contains : !contains) continue;
            acc.push([value, index]);
          }
          return acc;
        },
        [] as [string, number][],
      );
    } else if (wildcard[index] === "?") states = states.filter((state) => state[0][state[1]] !== undefined);
    else if (wildcard[index] === "[") {
      globBrackets().run();
    } else {
      globSymbol().run();
    }
    if (states.length === 0) return [];
    states.forEach((state) => (state[1] += 1));
  }
  states = states.filter((state) => state[0].length === state[1]);
  return states.map(([value]) => value);
}
