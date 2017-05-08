[![Build Status](https://travis-ci.org/philcockfield/msync.svg?branch=master)](https://travis-ci.org/philcockfield/msync)
![msync](https://cloud.githubusercontent.com/assets/185555/25552911/06c09016-2cfa-11e7-910c-a3723dff3f12.png)


A powerful toolkit for building and syncing multiple node-modules in a flexibly defined workspace.



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
![Image](https://cloud.githubusercontent.com/assets/185555/25559120/2120a7b8-2d89-11e7-97a9-e8dd3ca7dc75.png)

### sync
![Image](https://cloud.githubusercontent.com/assets/185555/25559130/51c4dd4e-2d89-11e7-9f50-6adca46c7db2.png)

### build (typescript)
![Image](https://cloud.githubusercontent.com/assets/185555/25559109/ff123b14-2d88-11e7-8781-3f150f54c2a8.png)

Use the `--help` (`-h`) flag to see the options for each command, eg:

    msync sync --help

# Ignore
You can ignore file `paths` and module `names` by declaring an `ignore` block in the `sync.yaml` definition:


```yaml
ignore:
  paths:
    - ./sample/**/ignore-folder
  names:
    - 'module-4'

```





### `build`
Builds all typescript modules.

```js
await build();
await build({ 
  includeIgnored: boolean         // Default: false 
});
```


## Other Approaches
Here are some other approaches to the problem that you might prefer:

- [NPM link](https://docs.npmjs.com/cli/link) - Our old friend `npm link`. Good luck with that!

- [Lerna](https://lernajs.io/): A tool for managing JavaScript projects with multiple packages.


## Next Steps
- workspaces
- `bump` - update version of one modules, and patch all dependent modules.
