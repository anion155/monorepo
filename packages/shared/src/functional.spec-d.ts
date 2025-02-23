import { Equal, Expect, expectType } from "../type-tests";
import { clone, identity, noop, pipe, PipeFunctor } from "./functional";

// noop should be accepted anywhere where undefined returned
((fn: (a: number) => number | undefined) => {})(noop);
expectType<undefined[]>([5, 6].map(noop));

// identity should be accepted anywhere where first argument value can be returned
(<Value>(fn: (value: Value) => Value) => {})(identity);
expectType<number[]>([5, 6].map(identity));

type CloneCases = [
  // should return function with same call signature
  Expect<Equal<(a: number, b: string) => object, ReturnType<typeof clone<(a: number, b: string) => object>>>>,
];

const piped = pipe((a: string, b: number) => ({
  test(c: string) {
    return (b + a + c).length;
  },
}))
  .method("test", "5")
  .pipe((length) => Array.from({ length }, (_, i) => i));
expectType<PipeFunctor<[a: string, b: number], number[]>>(piped);
