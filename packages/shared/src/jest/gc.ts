/** Exposes v8's gc function */
export async function runGC(ticks = 10) {
  const hadGC = !!globalThis.gc;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
  require("v8").setFlagsFromString("--expose-gc");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-require-imports
  require("vm").runInNewContext("gc")();
  for (; ticks >= 0; ticks -= 1) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  if (!hadGC) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access
    require("v8").setFlagsFromString("--no-expose-gc");
  }
}
