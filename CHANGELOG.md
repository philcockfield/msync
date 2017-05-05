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

## [Unreleased] - YYYY-MM-DD
#### Added
- Listing latest version details from NPM (see the `-n` flag for `ls`).
- Bumping to modules accounting for the latest versions on NPM (see `bump -n`).
- Added "dry run" flag to `bump` so that no files are saved (see `bump -d`).
- Spinner when pulling settings from NPM.
#### Changed
#### Deprecated
#### Removed
#### Fixed
#### Security


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
