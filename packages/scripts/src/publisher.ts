#!/usr/bin/env jiti

import "./utils/polyfils";

import { $, cd } from "zx";
import { commandsParser } from "./utils/argv";
import { cdRoot } from "./utils/cd-root";
import { main } from "./utils/main";

await main(async (argv, stack) => {
  await cdRoot();
  const [version] = commandsParser().addCommand("patch").addCommand("minor").addCommand("major").addCommand("undefined").parse();
  await $`pnpm run lint`;
  await $`pnpm run test`;
  await $`generate.exports`;
  if (version !== undefined) await $`pnpm version ${version}`;
  await $`builder`;
  cd("dist");
  await $`pnpm pack --out package.tgz`;
  // await $`pnpm publish package.tgz --dry-run --access public ${process.argv}`;
  cd("..");
  if (version !== "undefined") await $`pnpm version patch`;
});
