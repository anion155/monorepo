import { base, jest, react, typescript } from "@anion155/configs/eslint.config.ts";

/** @type {import('eslint').Linter.Config[]} */
export default [...base, ...typescript, ...jest, ...react];
