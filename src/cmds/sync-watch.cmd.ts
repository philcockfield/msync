import {
  log,
  file,
  IPackageObject,
  dependsOn,
  debounce,
} from '../common';
import * as listCommand from './ls.cmd';
import * as syncCommand from './sync.cmd';

export const name = 'sync:watch';
export const alias = 'sw';
export const description = 'Runs the sync command when files change.';
export const args = {
  '-i': 'Include ignored modules.',
};

/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {
      i?: boolean;
    },
  },
) {
  const options = (args && args.options) || {};
  await syncWatch({ includeIgnored: options.i });
}


export interface IOptions {
  includeIgnored?: boolean;
}


/**
 * Copies each module's dependency tree locally.
 */
export async function syncWatch(options: IOptions = {}) {
  // Setup initial conditions.
  log.info.magenta('\nSync on change:');
  const { includeIgnored = false } = options;
  const result = await listCommand.ls({ deps: 'local', includeIgnored });
  if (!result) { return; }
  const { modules, settings } = result;

  // Start the watcher for each module.
  modules.forEach((pkg) => watch(pkg, modules, settings.watchPattern, includeIgnored));
}



/**
 * Watches and syncs a single module.
 */
function watch(pkg: IPackageObject, modules: IPackageObject[], watchPattern: string, includeIgnored: boolean) {
  const sync = debounce(() => {
    const dependents = dependsOn(pkg, modules);
    if (dependents.length > 0) {
      log.info.green(`${pkg.name} changed:`);
      syncCommand.syncModules(dependents, includeIgnored);
    }
  }, 500);

  file
    .watch(`${pkg.dir}${watchPattern}`)
    .filter((path) => !path.includes('node_modules/'))
    .forEach(() => sync());
}
