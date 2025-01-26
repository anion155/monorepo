import { base, jestConfig, typescript } from "@anion155/configs/jest.config.js";
import { polyfill } from "@anion155/polyfill-base/jest.config.js";

/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default jestConfig({ ...base, setupFiles: [] }, typescript, polyfill);
