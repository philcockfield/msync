# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).


## [Unreleased] - YYYY-MM-DD
#### Added
#### Changed
#### Deprecated
#### Removed
#### Fixed
#### Security


## [2.4.0] - 2020-01-13
#### Changed
- Updated dependencies
- Removed borders from table logging.



## [2.2.0] - 2019-03-01
#### Added
- User prompts for modules to update the `package.json` files for after running `msync outdated`.
#### Changed
- Updated to use `@platform/util.exec`
- Updated to use `@platform/npm`
- Updated to use `@platform/log`
- Updated to use `@platform/fs`
- Set `chmod 777` on bin files after syncing. Prevents execution denied errors.
#### Deprecated
#### Removed
#### Fixed
#### Security



## [2.0.0] - 2018-10-12
#### Added
- Audit command. Runs an `npm audit` across all modules.

#### Changed
- Swapped out `yarn` commands to use `npm` now that NPM is as fast as yarn
  Effected commands:
  - `delete`
  - `publish`

## [1.11.0] - 2018-07-16
#### Added
- `typescript` (`ts`) comment for changing values in tsconfig.json files.
  Initial option used to flip the `noUnusedLocals` switch.

## [1.10.0] - 2018-07-9
#### Added
- `msync outdated` runs an `npm outdated` command on each module.
- `msync deleted` deletes transient files across projects (such as logs, yarn.lock, node_modules etc).

## [1.8.2] - 2018-03-31
#### Changed
- Write `__msync.js` to target typescript lib to force `nodemon` to restart.
- Updated Typescript versions (referencing @tdb libs)

## [1.7.0] - 2017-06-08
#### Changed
- `build` command running concurrently and syncing modules after each build.

## [1.6.0] - 2017-05-13
#### Added
- Full install and sync for `msync publish` using the `-f` flag.
  The option is slower but ensures all modules references, including changes to external module references, are consistent and correct. It is included as a flag because it is slower, and when publishing fast (without the flag) it is assumed that all internal modules have been synced and that dependencies are working.

  ![Screenshot](https://cloud.githubusercontent.com/assets/185555/26020254/6c5e8eba-37d0-11e7-940a-c55a50d70314.png)

## [1.5.0] - 2017-04-05
#### Added
- Listing latest version details from NPM (see the `-n` flag for `ls`).
- Bumping to modules accounting for the latest versions on NPM (see `bump -n`).
- Added "dry run" flag to `bump` so that no files are saved (see `bump -d`).
- Spinner when pulling settings from NPM.

## [1.4.0] - 2017-04-03
#### Added
- `bump` command. Bumps the specified module to the desired SemVer release, and then patch updates all dependent modules, walking through the dependency graph in order.

## [1.3.0] - 2017-05-01
#### Added
- `msync sync -v` command for syncing and saving version numbers on `package.json` files.

## [1.2.0] - 2017-05-01
#### Added
- Print `path` in module listing: `msync ls -p`
- `run` command.

## [1.1.0] - 2017-04-29
#### Added
- Sync watch command: `sync -w`
- Build command: `build`
- Build watch command: `build -w`

## [1.0.0] - 2017-04-29
#### Added

Initial creation and publish with `ls` and `sync` commands.
