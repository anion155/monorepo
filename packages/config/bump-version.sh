#/bin/sh

pnpm version $1 && git add ./package.json && git commit -m "bump: react-hooks $1" && git tag "react-hooks-v$1"
