# module-sync
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

Run the command line using `ms` to list, sync or build the modules:

![Image](https://cloud.githubusercontent.com/assets/185555/25547887/d81a8f00-2cbd-11e7-98f7-730138032c3f.png)
