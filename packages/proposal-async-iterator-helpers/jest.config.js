import { base, jestConfig, typescript } from "@anion155/configs/jest.config";
import { excludeProposals, polyfillConfig } from "@anion155/polyfill-base/jest.config";

export default jestConfig(base, polyfillConfig, { setupFiles: ["@anion155/proposal-iterator-helpers/global"] }, excludeProposals(typescript()));
