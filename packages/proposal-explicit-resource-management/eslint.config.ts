import { base, jest, typescript } from "@anion155/configs/eslint.config";

/** @type {import('eslint').Linter.Config[]} */
export default [...base, ...typescript, ...jest];
