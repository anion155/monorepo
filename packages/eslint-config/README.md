# What is this module about?

It's my personal eslint configuration. It's based on `eslint-config-airbnb`, has support for prettier, and some other `eslint` plugins.

## Usage

```sh
// Node Package Manager
npm install --save-dev @anion155/eslint-config eslint prettier typescript
// OR
// Yarn Package Manager
yarn add --dev @anion155/eslint-config eslint prettier typescript

tsc --init
```

```json
// .eslintrc.json
{
  "extends": ["@anion155"],
  "parserOptions": {
    "project": "./tsconfig.json"
  }
}
```

## jestConfig

There is also override configuration for jest test files. Default structure is `__tests__` sub folders in sources and `.spec` sub extension:

- src/
  - moduleA.ts
  - __tests__/
    - moduleA.spec.ts

Used like this

```js
// .eslintrc.js
const jestConfig = require('@anion155/eslint-config/jest');

/** @type {import('eslint').Linter.Config} */
module.exports = {
  "root": true,
  "extends": ["@anion155"],
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "overrides": [
    jestConfig({}),
  ]
}
```
