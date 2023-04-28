# What is this module about?

It's my personal eslint configuration. It's a complementary package with typescript configurations for `@anion155/eslint-config`. By default uses override config for `*.ts` and `*.tsx` files.

## Usage

```sh
npm install --save-dev @anion155/eslint-config-typescript @anion155/eslint-config eslint prettier typescript

tsc --init
```

```json
// .eslintrc.json
{
  "extends": ["@anion155/eslint-config", "@anion155/eslint-config-typescript"]
}
```

## `@anion155/eslint-config-typescript/plain`

You can use plain configuration without overrides based on extensions or to create your own override based on this configuration by using `plain` submodule:

```json
{
  "extends": ["@anion155/eslint-config", "@anion155/eslint-config-typescript/plain"]
}
```
