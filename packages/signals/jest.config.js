import { base, jestProjects, reactDOM, typescript } from "@anion155/configs/jest.config";

export default jestProjects(() => [base, typescript()], {
  tests: [{ testMatch: ["<rootDir>/src/**/*.spec.ts"] }],
  "reactDOM tests": [{ testMatch: ["<rootDir>/src/react/**/*.spec.tsx"] }, reactDOM],
});
