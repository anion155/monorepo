import { jestConfig } from "@anion155/configs/jest.config";

export const matchers = jestConfig({
  setupFiles: ["@anion155/shared/jest"],
});
