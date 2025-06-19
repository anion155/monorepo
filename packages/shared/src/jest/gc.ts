/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
/** Exposes v8's gc function */
export async function runGC(ticks = 10) {
  const hadGC = !!globalThis.gc;
  require("v8").setFlagsFromString("--expose-gc");
  require("vm").runInNewContext("gc")();
  for (; ticks >= 0; ticks -= 1) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  if (!hadGC) {
    require("v8").setFlagsFromString("--no-expose-gc");
  }
}
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
