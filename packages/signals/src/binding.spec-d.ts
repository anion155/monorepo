import "./signal-computed-extensions";

import type { Equal, Expect } from "@anion155/shared/type-tests";

import { SignalBinding } from "./binding";

const signalA = new SignalBinding(1);
type ACase = [
  Expect<Equal<typeof signalA, SignalBinding<number, number>>>,
  Expect<Equal<typeof signalA.value, number>>,
  Expect<Equal<ReturnType<typeof signalA.peak>, number>>,
];

const signalB = new SignalBinding(1, String);
type BCase = [
  Expect<Equal<typeof signalB, SignalBinding<string, number>>>,
  Expect<Equal<typeof signalB.value, string>>,
  Expect<Equal<ReturnType<typeof signalB.peak>, string>>,
];
signalB.value = 1;
signalB.value = "1";
signalB.value = () => 1;
signalB.value = () => "1";
signalB.set(1);
signalB.set("1");
signalB.set(() => 1);
signalB.set(() => "1");
signalB.update((current) => {
  type BUpdateCase = [Expect<Equal<typeof current, string>>];
  return 1;
});
signalB.update((current) => "1");
signalB.update((current) => () => 1);
signalB.update((current) => () => "1");
