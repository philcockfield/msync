# module-sync

[![Build Status](https://travis-ci.org/philcockfield/module-sync.svg?branch=master)](https://travis-ci.org/philcockfield/module-sync)

Manages building and syncing multiple node modules.



## Install

    npm install -g module-sync



## Usage
Create a `sync.yaml` file to define the modules within your workspace.

```yaml
modules:
  - ./sample/*/package.json
  - ./sample/libs/*/package.json
```

Run the command line using `ms` within your workspace folder to list, sync or build the modules:

![Image](https://cloud.githubusercontent.com/assets/185555/25547887/d81a8f00-2cbd-11e7-98f7-730138032c3f.png)



# API
All command-line options can be programatically invoked:

```js
import { ls, sync } from 'module-sync';
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
```



## Next Steps

- `sync:watch`
- `build` (Typescript)
- `build:watch`
- yaml:
    - `ignore` (modules)
      - paths
      - names (module names)
      - `ignoreSync`
      - `ignoreBuild`

