# @anion155/proposal-explicit-resource-management

Implementation of the [Explicit Resource Management proposal for ECMAScript](https://github.com/tc39/proposal-explicit-resource-management).
This package provides the proposal semantics and polyfills intended for testing, polyfilling, and proposal exploration.

## Install

Install with npm:

```bash
npm install @anion155/proposal-explicit-resource-management
```

## Usage

```ts
// To polyfill prototypes and constructor without modifying global scope
import { DisposableStack } from "@anion155/proposal-explicit-resource-management";

// or

// To also polyfill global scope use this import
import "@anion155/proposal-explicit-resource-management/global";
// and
// To install types
import "@anion155/proposal-explicit-resource-management/types";

class Constructor {
  #disposables:

  constructor() {
    using stack = new DisposableStack();
    this.#channel = stack.use(new NodeProcessIpcChannelAdapter(process));
    this.#socket = stack.use(new NodePluginHostIpcSocket(this.#channel));
    this.#disposables = stack.move();
  }
}
```
