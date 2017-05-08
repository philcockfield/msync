import {
  log,
  loadSettings,
  ISettings,
  constants,
  table,
  IModule,
  filter,
  fsPath,
  semver,
} from '../common';
import { printTable } from './ls.cmd';

export const name = 'publish';
export const alias = 'p';
export const description = 'Publishes all modules that are ahead of NPM.';
export const args = {
};


/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {
    },
  },
) {
  // const options = (args && args.options) || {};
  await publish({});
}


export interface IOptions { }

export async function publish(options: IOptions = {}) {
  const settings = await loadSettings({ npm: true, spinner: true });
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }

  const modules = settings
    .modules
    .filter((pkg) => isPublishRequired(pkg));
  printTable(modules);

  console.log("TODO...");

}


const isPublishRequired = (pkg: IModule) =>
  pkg.npm
    ? semver.gt(pkg.version, pkg.npm.latest)
    : false;
