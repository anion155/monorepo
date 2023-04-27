/** @type {import('eslint').Linter.Config} */
const config = {
  extends: [
    "eslint:recommended",
    "airbnb",
    "airbnb/hooks",
    "prettier",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:eslint-comments/recommended",
  ],
  plugins: ["import", "react-hooks", "prettier", "eslint-comments"],
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
  },
};

module.exports = config;
