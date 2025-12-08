import type { MaybePromise } from "./maybe";
import { Maybe } from "./maybe";
import type { Equal, Expect, Extends } from "./type-tests";

/* prettier-ignore */
const genericThenCases = <Value>(maybe: Maybe<Value>) => {
  type aCase = Expect<Equal<typeof a, Maybe<never> | Maybe<number>>>;                     const a = maybe.then(() => 5);
  type bCase = Expect<Equal<typeof b, Maybe<never> | Promise<string>>>;                   const b = maybe.then(() => Promise.resolve(""));
  type cCase = Expect<Equal<typeof c, Maybe<never> | Promise<string> | Maybe<5>>>;        const c = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type dCase = Expect<Equal<typeof d, Maybe<number> | MaybePromise<Value>>>;              const d = maybe.then(null, () => 5);
  type eCase = Expect<Equal<typeof e, Promise<string> | MaybePromise<Value>>>;            const e = maybe.then(null, () => Promise.resolve(""));
  type fCase = Expect<Equal<typeof f, Promise<string> | Maybe<5> | MaybePromise<Value>>>; const f = maybe.then(null, () => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type gCase = Expect<Equal<typeof g, Maybe<number>>>;                                    const g = maybe.then(() => 5, () => 5);
  type hCase = Expect<Equal<typeof h, Maybe<number> | Promise<string>>>;                  const h = maybe.then(() => 5, () => Promise.resolve(""));
  type iCase = Expect<Equal<typeof i, Maybe<number> | Promise<string> | Maybe<5>>>;       const i = maybe.then(() => 5, () => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type jCase = Expect<Equal<typeof j, Maybe<number> | Promise<string>>>;                  const j = maybe.then(() => Promise.resolve(""), () => 5);
  type kCase = Expect<Equal<typeof k, Promise<string>>>;                                  const k = maybe.then(() => Promise.resolve(""), () => Promise.resolve(""));
  type lCase = Expect<Equal<typeof l, Promise<string> | Maybe<5>>>;                       const l = maybe.then(() => Promise.resolve(""), () => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type mCase = Expect<Equal<typeof m, Maybe<number> | Promise<string> | Maybe<5>>>;       const m = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5, () => 5);
  type nCase = Expect<Equal<typeof n, Promise<string> | Maybe<5>>>;                       const n = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5, () => Promise.resolve(""));
  type oCase = Expect<Equal<typeof o, Promise<string> | Maybe<5> | Promise<void>>>;       const o = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5, () => Math.random() > 0.5 ? Promise.resolve() : 5);
}

/* prettier-ignore */
const valueThenCases = () => {
  const maybe = Maybe.resolve(new Date());
  type aCase = Expect<Equal<typeof a, Maybe<never> | Maybe<number>>>;               const a = maybe.then(() => 5);
  type bCase = Expect<Equal<typeof b, Maybe<never> | Promise<string>>>;             const b = maybe.then(() => Promise.resolve(""));
  type cCase = Expect<Equal<typeof c, Maybe<never> | Promise<string> | Maybe<5>>>;  const c = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type dCase = Expect<Equal<typeof d, Maybe<Date> | Maybe<number>>>;                const d = maybe.then(null, () => 5);
  type eCase = Expect<Equal<typeof e, Maybe<Date> | Promise<string>>>;              const e = maybe.then(null, () => Promise.resolve(""));
  type fCase = Expect<Equal<typeof f, Maybe<Date> | Promise<string> | Maybe<5>>>;   const f = maybe.then(null, () => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type gCase = Expect<Equal<typeof g, Maybe<number>>>;                              const g = maybe.then(() => 5, () => 5);
  type hCase = Expect<Equal<typeof h, Maybe<number> | Promise<string>>>;            const h = maybe.then(() => 5, () => Promise.resolve(""));
  type iCase = Expect<Equal<typeof i, Maybe<number> | Promise<string> | Maybe<5>>>; const i = maybe.then(() => 5, () => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type jCase = Expect<Equal<typeof j, Maybe<number> | Promise<string>>>;            const j = maybe.then(() => Promise.resolve(""), () => 5);
  type kCase = Expect<Equal<typeof k, Promise<string>>>;                            const k = maybe.then(() => Promise.resolve(""), () => Promise.resolve(""));
  type lCase = Expect<Equal<typeof l, Promise<string> | Maybe<5>>>;                 const l = maybe.then(() => Promise.resolve(""), () => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type mCase = Expect<Equal<typeof m, Maybe<number> | Promise<string> | Maybe<5>>>; const m = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5, () => 5);
  type nCase = Expect<Equal<typeof n, Promise<string> | Maybe<5>>>;                 const n = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5, () => Promise.resolve(""));
  type oCase = Expect<Equal<typeof o, Promise<string> | Maybe<5> | Promise<void>>>; const o = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5, () => Math.random() > 0.5 ? Promise.resolve() : 5);
}

/* prettier-ignore */
const errorThenCases = () => {
  const maybe = Maybe.reject(new Error('test'));
  type aCase = Expect<Equal<typeof a, Maybe<never> | Maybe<number>>>;               const a = maybe.then(() => 5);
  type bCase = Expect<Equal<typeof b, Maybe<never> | Promise<string>>>;             const b = maybe.then(() => Promise.resolve(""));
  type cCase = Expect<Equal<typeof c, Maybe<never> | Promise<string> | Maybe<5>>>;  const c = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type dCase = Expect<Equal<typeof d, Maybe<never> | Maybe<number>>>;               const d = maybe.then(null, () => 5);
  type eCase = Expect<Equal<typeof e, Maybe<never> | Promise<string>>>;             const e = maybe.then(null, () => Promise.resolve(""));
  type fCase = Expect<Equal<typeof f, Maybe<never> | Promise<string> | Maybe<5>>>;  const f = maybe.then(null, () => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type gCase = Expect<Equal<typeof g, Maybe<number>>>;                              const g = maybe.then(() => 5, () => 5);
  type hCase = Expect<Equal<typeof h, Maybe<number> | Promise<string>>>;            const h = maybe.then(() => 5, () => Promise.resolve(""));
  type iCase = Expect<Equal<typeof i, Maybe<number> | Promise<string> | Maybe<5>>>; const i = maybe.then(() => 5, () => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type jCase = Expect<Equal<typeof j, Maybe<number> | Promise<string>>>;            const j = maybe.then(() => Promise.resolve(""), () => 5);
  type kCase = Expect<Equal<typeof k, Promise<string>>>;                            const k = maybe.then(() => Promise.resolve(""), () => Promise.resolve(""));
  type lCase = Expect<Equal<typeof l, Promise<string> | Maybe<5>>>;                 const l = maybe.then(() => Promise.resolve(""), () => Math.random() > 0.5 ? Promise.resolve("") : 5);
  type mCase = Expect<Equal<typeof m, Maybe<number> | Promise<string> | Maybe<5>>>; const m = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5, () => 5);
  type nCase = Expect<Equal<typeof n, Promise<string> | Maybe<5>>>;                 const n = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5, () => Promise.resolve(""));
  type oCase = Expect<Equal<typeof o, Promise<string> | Maybe<5> | Promise<void>>>; const o = maybe.then(() => Math.random() > 0.5 ? Promise.resolve("") : 5, () => Math.random() > 0.5 ? Promise.resolve() : 5);
}

type PromiseLikeCase = [
  //
  Expect<Extends<Maybe<Date>, PromiseLike<Date>>>,
];

async function asyncAwaitCase() {
  const value = await Maybe.resolve(5);
  type AsyncAwaitCases = [
    //
    Expect<Extends<typeof value, number>>,
    Expect<Extends<Awaited<Maybe<Date>>, Date>>,
  ];
}

/* prettier-ignore */
const tryCases = <Value>() => {
  type aCase = Expect<Equal<typeof a, Maybe<number>>>;                                            const a = Maybe.try(() => 5);
  type bCase = Expect<Equal<typeof b, Promise<number>>>;                                          const b = Maybe.try(() => Promise.resolve(5));
  type cCase = Expect<Equal<typeof c, Maybe<number> | Promise<number>>>;                          const c = Maybe.try(() => null as never as number | Promise<number>);
  type dCase = Expect<Equal<typeof d, MaybePromise<Value>>>;                                      const d = Maybe.try(() => null as never as Value);
  type eCase = Expect<Equal<typeof e, Maybe<number> | Maybe<never> | Promise<number>>>;           const e = d.then(() => 5);
  type fCase = Expect<Equal<typeof f, Maybe<number> | Maybe<string> | Promise<number | string>>>; const f = d.then(() => 5, () => '');
  type gCase = Expect<Equal<typeof g, Promise<unknown> | Maybe<number>>>;                         const g = d.catch(() => 5);
}
