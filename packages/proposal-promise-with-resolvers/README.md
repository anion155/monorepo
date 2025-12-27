# @anion155/proposal-promise-with-resolvers

Implementation of the [Promise.withResolvers proposal for ECMAScript](https://github.com/tc39/proposal-promise-with-resolvers).
This package provides the proposal semantics and polyfills intended for testing, polyfilling, and proposal exploration.

## Install

Install with npm:

```bash
npm install @anion155/proposal-promise-with-resolvers
```

## Usage

```ts
// To polyfill prototypes and constructor without modifying global scope
import "@anion155/proposal-promise-with-resolvers";
// and
// To install types
import "@anion155/proposal-promise-with-resolvers/types";

const { promise, resolve, reject } = Promise.withResolvers();
```
