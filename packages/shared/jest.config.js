import { base, jestProject, react, typescript } from "@anion155/configs/jest.config.js";

/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  projects: [
    jestProject("tests", ["<rootDir>/src/**/*.spec.ts"], base, typescript()),
    jestProject("react tests", ["<rootDir>/src/react/**/*.spec.tsx"], base, typescript(), react),
  ],
};
