[![Build Status](https://travis-ci.org/philcockfield/msync.svg?branch=master)](https://travis-ci.org/philcockfield/msync)
![msync](https://cloud.githubusercontent.com/assets/185555/25552903/b9ba0356-2cf9-11e7-8a5f-1d29797c475c.png)


Easily manage building and syncing multiple node-modules in a flexibly defined workspace.



## Install

    npm install -g msync



## Usage
Create a `sync.yaml` file to define the modules within your workspace.

```yaml
modules:
  - ./sample/*/package.json
  - ./sample/libs/*/package.json
```

Run the command line using `msync` within your workspace folder to list, sync or build the modules:

![Image](https://cloud.githubusercontent.com/assets/185555/25552563/4aed2708-2cf1-11e7-87c4-715d15ddd8c1.png)

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




# API
All command-line options can be programatically invoked:

```js
import { ls, sync } from 'msync';
```

### ls (list)
List modules in dependency order.

```js
await ls();
await ls({ deps: 'local' });
await ls({ deps: 'all' });
```

### sync
Syncs each module's dependency tree locally.

```js
await sync();
await sync({ ignored: true });
```



## Next Steps

- `sync:watch`
- `build` (Typescript)
- `build:watch`
