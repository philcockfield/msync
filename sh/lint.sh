#!/bin/bash

# Format code.
node ./node_modules/prettier/bin-prettier --write 'code/src/**/*.ts{,x}'

# Lint.
node ./node_modules/tslint/bin/tslint 'code/src/**/*.ts{,x}' --format verbose --fix $@