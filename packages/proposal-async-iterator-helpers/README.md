# @anion155/proposal-async-iterator-helpers

Implementation of the [Async Iterator Helpers proposal for ECMAScript](https://github.com/tc39/proposal-async-iterator-helpers).
This package provides the proposal semantics and polyfills intended for testing, polyfilling, and proposal exploration.

## Install

Install with npm:

```bash
npm install @anion155/proposal-async-iterator-helpers
```

It your environment does not have im plementation of [Iterator Helpers proposal for ECMAScript](https://github.com/tc39/proposal-iterator-helpers),
you can use this popyfill:

```bash
npm install @anion155/proposal-iterator-helpers
```

## Usage

```js
// To polyfill prototypes and constructor without modifying global scope
import "@anion155/proposal-async-iterator-helpers";
// or
// To also polyfill global scope use this import
import "@anion155/proposal-async-iterator-helpers/global";
// and
// To install types
import "@anion155/proposal-async-iterator-helpers/types";

async function* fetchData() {
  while (true) {
    const response = await fetch(`https://example.com/example.json?d=${Date.now()}`)
    const json = await response.json()
    yield json as { frequently_changed_data: string }
  }
}
const result = fetchData().map(({frequently_changed_data}) => {
  return Number(frequently_changed_data);
});
await result.next(); // { value: 0, done: false };
await result.next(); // { value: 1, done: false };
await result.next(); // { value: 4, done: false };
```
