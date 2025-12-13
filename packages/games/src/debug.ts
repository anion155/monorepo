import { SignalState } from "@anion155/signals";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DebugFlags {}
}

const values = new SignalState<DebugFlags>({} as never);
let defaultValue: unknown = undefined;
const controller = {
  get<Flag extends keyof DebugFlags>(flag: Flag): DebugFlags[Flag] | undefined {
    return values.field(flag).value ?? (defaultValue as never);
  },
  set<Flag extends keyof DebugFlags>(flag: Flag, value: DebugFlags[Flag]) {
    values.field(flag).set(value);
  },
  changeDefault(next: unknown) {
    defaultValue = next;
  },
  clear<Flag extends keyof DebugFlags>(flag: Flag) {
    values.field(flag).set(undefined as never);
  },
};
declare global {
  var DEBUG: typeof controller;
}
globalThis.DEBUG = controller;

export {};

// defaultValue = true;
