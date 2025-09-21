import type { Equal, Expect } from "../type-tests";
import { EventEmitter } from "./event-emitter";

const emitter = new EventEmitter<{
  a(b: number, c: string): string;
  d(e: Date): number;
}>();

emitter.on("a", (...params) => {
  type OnListenerCase = [
    //
    Expect<Equal<typeof params, [b: number, c: string]>>,
  ];
});
emitter.off("a", (...params) => {
  type OffListenerCase = [
    //
    Expect<Equal<typeof params, [b: number, c: string]>>,
  ];
});
type EmitCase = [
  //
  Expect<Equal<typeof emitter.emit<"a">, (event: "a", b: number, c: string) => void>>,
];
