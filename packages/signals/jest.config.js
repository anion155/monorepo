import { base, jestProjects, reactDOM, typescript } from "@anion155/configs/jest.config.js";

/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default jestProjects({
  tests: [{ testMatch: ["<rootDir>/src/**/*.spec.ts"] }, base, typescript()],
  "reactDOM tests": [{ testMatch: ["<rootDir>/src/react/**/*.spec.tsx"] }, base, typescript(), reactDOM],
});
