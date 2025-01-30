import { base, jestConfig, typescript } from "@anion155/configs/jest.config.js";
import { excludeProposals, polyfillConfig } from "@anion155/polyfill-base/jest.config.js";

export default excludeProposals(jestConfig(base, typescript(), polyfillConfig));
