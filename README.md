[![Build Status](https://travis-ci.org/philcockfield/msync.svg?branch=master)](https://travis-ci.org/philcockfield/msync)

![msync](https://cloud.githubusercontent.com/assets/185555/25552911/06c09016-2cfa-11e7-910c-a3723dff3f12.png)

A powerful toolkit for managing multiple node-modules in a flexibly defined workspace, just the way you like it.

- `build` and watch (typescript)
- `sync` and watch (dependency graph)
- `bump` (versions in dependency graph order)
- `publish` (to NPM)
- `outdated` (list all outdated modules)

![Video](https://user-images.githubusercontent.com/185555/41953183-5378ca3c-7a28-11e8-8056-a921a0cf9565.gif)

## Install

    npm install -g msync

## Usage

Create a `sync.yaml` file to define the modules within your workspace.

```yaml
modules:
  - ./sample/*/package.json
  - ./sample/libs/*/package.json

watchPattern: /lib/**/*.js # The files that when changed cause a sync to occur.
```

Run the command line using `msync` within your workspace folder to list, sync or build the modules:

### ls (list)

![Image](https://cloud.githubusercontent.com/assets/185555/25798458/56674ff0-3435-11e7-854d-2a1ddb45b3d0.png)

### sync

![Image](https://cloud.githubusercontent.com/assets/185555/25559130/51c4dd4e-2d89-11e7-9f50-6adca46c7db2.png)

### build (typescript)

![Image](https://cloud.githubusercontent.com/assets/185555/25559109/ff123b14-2d88-11e7-8781-3f150f54c2a8.png)

### outdated

![Image](https://user-images.githubusercontent.com/185555/42003427-769d282c-7abf-11e8-85cd-fac2177541e6.png)

### watch

Starts watchers for `build` and `sync` in new tabs. Requires a terminal like [iTerm2](https://www.iterm2.com/) that can recieve "new tab" instructions.

### delete

Deletes common transient folders from across all modules, such as logs (`yarn-error.log` and `npm-debug.log`) or `yarn.lock` files, or `node_modules` folder etc.

### tsconfig

Common transformations across typescript configuration files, eg flipping the `noUnusedLocals` switch.

## Help

Use the `--help` (`-h`) flag to see the options for each command, eg:

    msync sync --help

## Ignore

You can ignore file `paths` and module `names` by declaring an `ignore` block in the `sync.yaml` definition:

```yaml
ignore:
  paths:
    - ./sample/**/ignore-folder
  names:
    - 'module-4'
```

## Other Approaches

Here are some other approaches to the problem that you might prefer:

- [NPM link](https://docs.npmjs.com/cli/link) - Our old friend `npm link`. Good luck with that!

- [Lerna](https://lernajs.io/): A tool for managing JavaScript projects with multiple packages.

## Next Steps

- workspaces
