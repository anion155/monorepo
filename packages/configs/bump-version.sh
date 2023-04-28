#/bin/sh

pnpm version $2 && git add ./package.json && git commit -m "bump: $1 $2" && git tag "$1-v$2"
