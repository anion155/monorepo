import { hasTypedField } from "@anion155/shared/is";
import { $ } from "zx";
import { Logger, LogLevels } from "./logger";
import { PackageJson } from "./package.json";

export const scriptRunner = (pkg: PackageJson, logger?: Logger) => (scriptName: string) => {
  if (hasTypedField(pkg.scripts, scriptName, "string")) {
    logger?.log?.(`executing ${scriptName} script:`);
    logger?.get(LogLevels.log, { header: false, formats: "grey" })?.(`> ${pkg.scripts[scriptName]}`);
    return $`pnpm run ${scriptName}`;
  }
  return false;
};
