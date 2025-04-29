import { describe, expect, it } from "@jest/globals";

import { glob, InvalidGlobPattern } from "./glob";

describe("glob()", () => {
  it("should match exact strings", () => {
    const values = ["file.txt", "file1.txt", "file2.txt"];
    expect(values.filter(glob("file.txt"))).toStrictEqual(["file.txt"]);
    expect(values.filter(glob("unknown"))).toStrictEqual([]);
  });

  it("should match using wildcard *", () => {
    const values = ["file.txt", "file1.txt", "file2.txt", "image.png"];
    expect(values.filter(glob("*"))).toStrictEqual(values);
    expect(values.filter(glob("file*"))).toStrictEqual(["file.txt", "file1.txt", "file2.txt"]);
    expect(values.filter(glob("file*t"))).toStrictEqual(["file.txt", "file1.txt", "file2.txt"]);
  });

  it("should match using wildcard ?", () => {
    const values = ["file.txt", "file1.txt", "file2.txt", "file12.txt"];
    expect(values.filter(glob("file?.txt"))).toStrictEqual(["file1.txt", "file2.txt"]);
  });

  it("should match character ranges", () => {
    const values = ["file1.txt", "file2.txt", "fileA.txt", "fileB.txt", "file].txt", "file-.txt"];
    expect(values.filter(glob("file[1-2].txt"))).toStrictEqual(["file1.txt", "file2.txt"]);
    expect(values.filter(glob("file[A-B].txt"))).toStrictEqual(["fileA.txt", "fileB.txt"]);
    expect(values.filter(glob("file[\\]].txt"))).toStrictEqual(["file].txt"]);
    // expect(values.filter(glob("file[][!].txt"))).toStrictEqual(["file].txt", "file-.txt"]);
    expect(values.filter(glob("file[1-].txt"))).toStrictEqual(["file1.txt", "file-.txt"]);
    expect(values.filter(glob("file[-1].txt"))).toStrictEqual(["file1.txt", "file-.txt"]);
  });

  it("should match negated character ranges", () => {
    const values = ["file1.txt", "file2.txt", "fileA.txt", "fileB.txt"];
    expect(values.filter(glob("file[!1-2].txt"))).toStrictEqual(["fileA.txt", "fileB.txt"]);
  });

  it("should match character range after asterisk", () => {
    const values = ["file1.txt", "file2.txt", "fileA.txt", "fileB.txt"];
    expect(values.filter(glob("f*\\1.txt"))).toStrictEqual(["file1.txt"]);
    expect(values.filter(glob("f*[1-2].txt"))).toStrictEqual(["file1.txt", "file2.txt"]);
    expect(values.filter(glob("f*[!1-2].txt"))).toStrictEqual(["fileA.txt", "fileB.txt"]);
  });

  it("should handle POSIX character classes", () => {
    const values = ["cat", "1at", "-at", "Cat", "fat", "1file.txt", "file.txt", "2file.txt", "file$.txt"];
    // Alphanumeric characters
    expect(values.filter(glob("[[:alnum:]]at"))).toStrictEqual(["cat", "1at", "Cat", "fat"]);
    // Alphabetic characters
    expect(values.filter(glob("[[:alpha:]]at"))).toStrictEqual(["cat", "Cat", "fat"]);
    // Digits
    expect(values.filter(glob("[[:digit:]]at"))).toStrictEqual(["1at"]);
    // Lowercase letters
    expect(values.filter(glob("[[:lower:]]at"))).toStrictEqual(["cat", "fat"]);
    // Uppercase letters
    expect(values.filter(glob("[[:upper:]]at"))).toStrictEqual(["Cat"]);
    // Uppercase letters
    expect(["a t", "a!t", "aat"].filter(glob("a[[:space:]]t"))).toStrictEqual(["a t"]);
    // Punctuation character
    expect(["a t", "a!t", "aat"].filter(glob("a[[:punct:]]t"))).toStrictEqual(["a!t"]);
    // Hexadecimal digits
    expect(["1at", "fat", "Cat", "9at", "gat"].filter(glob("[[:xdigit:]]at"))).toStrictEqual(["1at", "fat", "Cat", "9at"]);
  });

  it("should escape character", () => {
    expect(["[at", "fat", "Cat", "9at", "gat"].filter(glob("\\[at"))).toStrictEqual(["[at"]);
  });

  it("should match complex pattern", () => {
    expect(["file1.txt", "file2.txt", "file3.txt", "file4.txt"].filter(glob("file[1-3]*.t?t"))).toStrictEqual([
      "file1.txt",
      "file2.txt",
      "file3.txt",
    ]);
  });

  it("should throw an error for invalid patterns", () => {
    expect(() => glob("a\\")).toStrictThrow(new InvalidGlobPattern("escape can not be finishing character", "a\\", 1));
    expect(() => glob("a[")).toStrictThrow(new InvalidGlobPattern("bracket must be enclosed", "a[", 1));
    expect(() => glob("a[\\")).toStrictThrow(new InvalidGlobPattern("escape can not be finishing character", "a[\\", 2));
    expect(() => glob("a[1-[]")).toStrictThrow(
      new InvalidGlobPattern("use escape sequence instead to indicate '[' as last symbol in range", "a[1-[]", 3),
    );
    expect(() => glob("a[1-")).toStrictThrow(new InvalidGlobPattern("bracket must be enclosed", "a[1-", 1));
    expect(() => glob("a[12[a]")).toStrictThrow(new InvalidGlobPattern("use escape sequence instead to indicate '[' as symbol", "a[12[a]", 4));
    expect(() => glob("a[1[:a")).toStrictThrow(new InvalidGlobPattern("classname must be wrapped in [:<name>:]", "a[1[:a", 3));
    expect(() => glob("a[[:unknown:]]")).toStrictThrow(new InvalidGlobPattern('unknown classname used: "unknown"', "a[[:unknown:]]", 2));
    expect(() => glob("a[a-c")).toStrictThrow(new InvalidGlobPattern("bracket must be enclosed", "a[a-c", 1));
    expect(() => glob("a**")).toStrictThrow(new InvalidGlobPattern("deep sequence must be one and only token on level", "a**", 2));
  });

  it("InvalidGlobPattern.toString() should visualize error position", () => {
    expect(new InvalidGlobPattern("test message", "abcdefghijklmnop", 2).toString()).toBe(
      `InvalidGlobPattern: test message:
abcdefghijklmnop
  ^`,
    );
  });
});
