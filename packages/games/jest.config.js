import { base, jestProjects, typescript } from "@anion155/configs/jest.config";

export default jestProjects(() => [base, typescript()], {
  tests: [{ testMatch: ["<rootDir>/src/**/*.spec.ts"] }],
});
