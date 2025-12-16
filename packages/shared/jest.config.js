import { base, jestProjects, reactDOM, typescript } from "@anion155/configs/jest.config";

export default jestProjects(() => [base, typescript(), { setupFiles: ["./jest.matchers.ts"] }], {
  tests: [{ testMatch: ["<rootDir>/src/**/*.spec.ts"] }],
  "reactDOM tests": [{ testMatch: ["<rootDir>/src/**/*.spec.tsx"] }, reactDOM],
});
