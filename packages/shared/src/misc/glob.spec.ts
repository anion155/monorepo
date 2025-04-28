import { describe, expect, it } from "@jest/globals";

import { glob, InvalidGlobPattern } from "./glob";

describe("glob()", () => {
  it("should match exact strings", () => {
    const values = ["file.txt", "file1.txt", "file2.txt"];
    expect(glob("file.txt", values)).toStrictEqual(["file.txt"]);
    expect(glob("unknown", values)).toStrictEqual([]);
  });

  it("should match using wildcard *", () => {
    const values = ["file.txt", "file1.txt", "file2.txt", "image.png"];
    expect(glob("*", values)).toStrictEqual(values);
    expect(glob("file*", values)).toStrictEqual(["file.txt", "file1.txt", "file2.txt"]);
    expect(glob("file*t", values)).toStrictEqual(["file.txt", "file1.txt", "file2.txt"]);
  });

  it("should match using wildcard ?", () => {
    const values = ["file.txt", "file1.txt", "file2.txt", "file12.txt"];
    expect(glob("file?.txt", values)).toStrictEqual(["file1.txt", "file2.txt"]);
  });

  it("should match character ranges", () => {
    const values = ["file1.txt", "file2.txt", "fileA.txt", "fileB.txt", "file].txt", "file-.txt"];
    expect(glob("file[1-2].txt", values)).toStrictEqual(["file1.txt", "file2.txt"]);
    expect(glob("file[A-B].txt", values)).toStrictEqual(["fileA.txt", "fileB.txt"]);
    expect(glob("file[\\]].txt", values)).toStrictEqual(["file].txt"]);
    expect(glob("file[1-].txt", values)).toStrictEqual(["file1.txt", "file-.txt"]);
    expect(glob("file[-1].txt", values)).toStrictEqual(["file1.txt", "file-.txt"]);
  });

  it("should match negated character ranges", () => {
    const values = ["file1.txt", "file2.txt", "fileA.txt", "fileB.txt"];
    expect(glob("file[!1-2].txt", values)).toStrictEqual(["fileA.txt", "fileB.txt"]);
  });

  it("should match character range after asterisk", () => {
    const values = ["file1.txt", "file2.txt", "fileA.txt", "fileB.txt"];
    expect(glob("f*\\1.txt", values)).toStrictEqual(["file1.txt"]);
    expect(glob("f*[1-2].txt", values)).toStrictEqual(["file1.txt", "file2.txt"]);
    expect(glob("f*[!1-2].txt", values)).toStrictEqual(["fileA.txt", "fileB.txt"]);
  });

  it("should handle POSIX character classes", () => {
    const values = ["cat", "1at", "-at", "Cat", "fat", "1file.txt", "file.txt", "2file.txt", "file$.txt"];
    // Alphanumeric characters
    expect(glob("[[:alnum:]]at", values)).toStrictEqual(["cat", "1at", "Cat", "fat"]);
    // Alphabetic characters
    expect(glob("[[:alpha:]]at", values)).toStrictEqual(["cat", "Cat", "fat"]);
    // Digits
    expect(glob("[[:digit:]]at", values)).toStrictEqual(["1at"]);
    // Lowercase letters
    expect(glob("[[:lower:]]at", values)).toStrictEqual(["cat", "fat"]);
    // Uppercase letters
    expect(glob("[[:upper:]]at", values)).toStrictEqual(["Cat"]);
    // Uppercase letters
    expect(glob("a[[:space:]]t", ["a t", "a!t", "aat"])).toStrictEqual(["a t"]);
    // Punctuation character
    expect(glob("a[[:punct:]]t", ["a t", "a!t", "aat"])).toStrictEqual(["a!t"]);
    // Hexadecimal digits
    expect(glob("[[:xdigit:]]at", ["1at", "fat", "Cat", "9at", "gat"])).toStrictEqual(["1at", "fat", "Cat", "9at"]);
  });

  it("should escape character", () => {
    expect(glob("\\[at", ["[at", "fat", "Cat", "9at", "gat"])).toStrictEqual(["[at"]);
  });

  it("should throw an error for invalid patterns", () => {
    expect(() => glob("a**", ["a_file.txt"])).toStrictThrow(new InvalidGlobPattern("only nested glob supports double asterisks", "a**", 2));
    expect(() => glob("a\\", ["a"])).toStrictThrow(new InvalidGlobPattern("escape can't be finishing character", "a\\", 1));
    expect(() => glob("[a\\", ["a"])).toStrictThrow(new InvalidGlobPattern("escape can't be finishing character", "[a\\", 2));
    expect(() => glob("[[:al:num", ["file.txt"])).toStrictThrow(
      new InvalidGlobPattern('classname must be enclosed with ":]" pattern', "[[:al:num", 3),
    );
    expect(() => glob("[[:alnum\\:", ["file.txt"])).toStrictThrow(new InvalidGlobPattern("classname isn't found", "[[:alnum\\:", 3));
    expect(() => glob("[[:alnum", ["file.txt"])).toStrictThrow(new InvalidGlobPattern("classname isn't found", "[[:alnum", 3));
    expect(() => glob("[[:unknown:]]", ["file.txt"])).toStrictThrow(new InvalidGlobPattern('unknown classname used: "unknown"', "[[:unknown:]]", 3));
    expect(() => glob("[a-", ["file.txt"])).toStrictThrow(new InvalidGlobPattern("bracket must be enclosed", "[a-", 0));
    expect(() => glob("[ab", ["file.txt"])).toStrictThrow(new InvalidGlobPattern("bracket must be enclosed", "[ab", 0));
  });

  it("should match complex pattern", () => {
    expect(glob("file[1-3]*.t?t", ["file1.txt", "file2.txt", "file3.txt", "file4.txt"])).toStrictEqual(["file1.txt", "file2.txt", "file3.txt"]);
  });
});
