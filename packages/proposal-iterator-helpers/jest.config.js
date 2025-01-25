import { base, polyfill, typescript } from "@anion155/configs/jest.config.js";

/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  ...base,
  ...typescript,
  ...polyfill,
};
