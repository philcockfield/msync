#!/bin/bash

# Format code.
PRETTIER_CONFIG=$PWD/node_modules/@tdb/typescript/.prettierrc
cp $PRETTIER_CONFIG $PWD/.prettierrc
node ./node_modules/prettier/bin-prettier --write 'code/src/**/*.ts{,x}'

# Lint.
node ./node_modules/tslint/bin/tslint 'code/src/**/*.ts{,x}' --format verbose --fix $@