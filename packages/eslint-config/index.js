/** @type {import('eslint').Linter.Config} */
const config = {
  extends: [
    "eslint:recommended",
    "airbnb",
    "airbnb/hooks",
    "airbnb-typescript",
    "prettier",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:eslint-comments/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  settings: {
    "import/resolver": {
      typescript: true,
    },
  },
  plugins: [
    "import",
    "react-hooks",
    "@typescript-eslint",
    "prettier",
    "eslint-comments",
  ],
  rules: {
    "eslint-comments/require-description": [
      "warn",
      { ignore: ["eslint-enable"] },
    ],
    "eslint-comments/no-unused-disable": "warn",
    "import/order": [
      "error",
      {
        groups: [
          ["builtin", "external"],
          "internal",
          "parent",
          "sibling",
          "index",
          "object",
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    "import/newline-after-import": [
      "error",
      {
        count: 1,
      },
    ],
    "import/prefer-default-export": "off",
    semi: [2, "always"],
    "no-underscore-dangle": [
      "error",
      {
        allow: ["__"],
      },
    ],
    "no-unused-expressions": [
      "error",
      {
        allowTernary: true,
      },
    ],
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react/destructuring-assignment": [
      "error",
      "always",
      {
        ignoreClassFields: true,
      },
    ],
    "react/jsx-curly-newline": 0,
    "react/jsx-filename-extension": [
      "error",
      {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    ],
    "react/require-default-props": "off",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports" },
    ],
    "@typescript-eslint/no-shadow": [
      "error",
      {
        ignoreTypeValueShadow: true,
        ignoreFunctionTypeParameterNameValueShadow: true,
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        varsIgnorePattern: "[iI]gnored",
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^ignore",
      },
    ],
  },
};

module.exports = config;
