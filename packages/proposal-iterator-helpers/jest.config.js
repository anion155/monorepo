import { base, jestConfig, typescript } from "@anion155/configs/jest.config";
import { excludeProposals, polyfillConfig } from "@anion155/polyfill-base/jest.config";

export default excludeProposals(jestConfig(base, typescript(), polyfillConfig));
