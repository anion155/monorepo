import { base, jestProjects, typescript } from "@anion155/configs/jest.config.js";

export default jestProjects(() => [base, typescript()], {
  tests: [{ testMatch: ["<rootDir>/src/**/*.spec.ts"] }],
});
