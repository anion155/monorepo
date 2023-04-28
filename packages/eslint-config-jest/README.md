# What is this module about?

It's my personal eslint configuration. It's a complementary package with jest configurations for `@anion155/eslint-config`. Default structure is `__tests__` sub folders and `.spec` sub extension:

- src/
  - moduleA.ts
  - __tests__/
    - moduleA.spec.ts

## Usage

```sh
npm install --save-dev @anion155/eslint-config-jest @anion155/eslint-config eslint prettier jest
```

```json
// .eslintrc.json
{
  "extends": ["@anion155/eslint-config", "@anion155/eslint-config-jest"]
}
```

## `@anion155/eslint-config-jest/plain`

You can use plain configuration without overrides based on extensions or to create your own override based on this configuration by using `plain` submodule:

```json
{
  "extends": ["@anion155/eslint-config", "@anion155/eslint-config-jest/plain"]
}
```
