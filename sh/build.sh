#!/bin/bash
cd code
rm -rf ./lib
node ../node_modules/typescript/bin/tsc $@
