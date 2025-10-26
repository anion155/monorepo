import * as Keys from "keycode-js";

export { Keys };
export type KeysCode = (typeof Keys)[Extract<keyof typeof Keys, `CODE_${string}`>];
