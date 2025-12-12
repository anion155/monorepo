import { base, jestProjects, typescript } from "@anion155/configs/jest.config";
import { matchers } from "@anion155/shared/jest/config";

export default jestProjects(() => [base, typescript(), matchers], {
  tests: [{ testMatch: ["<rootDir>/src/**/*.spec.ts"] }],
});
