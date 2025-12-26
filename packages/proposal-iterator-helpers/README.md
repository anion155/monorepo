# @anion155/proposal-iterator-helpers

Implementation of the [Iterator Helpers proposal for ECMAScript](https://github.com/tc39/proposal-iterator-helpers).
This package provides the proposal semantics and polyfills intended for testing, polyfilling, and proposal exploration.

## Install

Install with npm:

```bash
npm install @anion155/proposal-iterator-helpers
```

## Usage

```js
// To polyfill prototypes and constructor without modifying global scope
import "@anion155/proposal-iterator-helpers";
// or
// To also polyfill global scope use this import
import "@anion155/proposal-iterator-helpers/global";
// and
// To install types
import "@anion155/proposal-iterator-helpers/types";

function* naturals() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}
const result = naturals().map((value) => {
  return value * value;
});
result.next(); // { value: 0, done: false };
result.next(); // { value: 1, done: false };
result.next(); // { value: 4, done: false };
```
