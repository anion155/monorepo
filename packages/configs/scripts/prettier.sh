#!/bin/sh

SOURCE=$(readlink -f -- "${BASH_SOURCE[0]}")
DIRNAME=$(dirname "${SOURCE}")

$DIRNAME/../node_modules/.bin/prettier $@
