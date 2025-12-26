import { hasTypedField } from "@anion155/shared/is";
import { assignFields } from "@anion155/shared/object";
import { $ } from "zx";
import { Logger, LogLevels } from "./logger";

export const scriptRunner = (pkg: PackageJson, logger?: Logger) => {
  return assignFields(
    (scriptName: string) => {
      if (hasTypedField(pkg.scripts, scriptName, "string")) {
        logger?.log?.(`executing '${scriptName}' script:`);
        logger?.get(LogLevels.log, { header: false, formats: "grey" })?.(`> ${pkg.scripts[scriptName]}`);
        return $`pnpm run ${scriptName}`;
      }
      return false;
    },
    {
      has(scriptName: string) {
        return hasTypedField(pkg.scripts, scriptName, "string");
      },
    },
  );
};
