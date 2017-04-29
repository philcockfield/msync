import {
  log,
  config,
  file,
  listr,
  copy,
  constants,
  IPackageObject,
  IDependency,
  elapsed,
  filter,
  debounce,
  dependsOn,
} from '../common';
import * as listCommand from './ls.cmd';


export const name = 'sync';
export const alias = 's';
export const description = 'Syncs each module\'s dependency tree within the workspace.';
export const args = {
  '-i': 'Include ignored modules.',
  '-w': 'Sync on changes to files.',
};



/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {
      i?: boolean;
      w?: boolean;
    },
  },
) {
  const options = (args && args.options) || {};
  const watch = options.w || false;
  const includeIgnored = options.i || false;
  if (watch) {
    await syncWatch({ includeIgnored });
  } else {
    await sync({ includeIgnored });
  }
}



export interface IOptions {
  includeIgnored?: boolean;
}


/**
 * Copies each module's dependency tree locally.
 */
export async function sync(options: IOptions = {}) {
  const { includeIgnored = false } = options;
  const settings = await config.init();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }

  const modules = settings
    .modules
    .filter((pkg) => filter.localDeps(pkg).length > 0)
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored));

  // Finish up.
  await syncModules(modules, includeIgnored);
  return { settings, modules };
}


/**
 * Syncs the given set of modules.
 */
export async function syncModules(modules: IPackageObject[], includeIgnored: boolean) {
  const startedAt = new Date();

  const sync = async (sources: IDependency[], target: IPackageObject) => {
    for (const source of sources) {
      if (source.package) {
        await copy.module(source.package, target);
      }
    }
  };

  const tasks = modules.map((target) => {
    const sources = filter
      .localDeps(target)
      .filter((dep) => filter.includeIgnored(dep.package, includeIgnored));
    const sourceNames = sources
      .map((dep) => ` ${log.cyan(dep.name)}`);
    return {
      title: `${log.magenta(target.name)} ${log.cyan('⬅')}${sourceNames}`,
      task: () => sync(sources, target),
    };
  });

  try {
    const taskList = listr(tasks, { concurrent: false });
    await taskList.run();
    log.info.gray('', elapsed(startedAt));
    log.info();

  } catch (error) {
    log.warn(log.yellow(`\nFailed while syncing module '${error.message}'.`));
  }

  // Finish up.
  return modules;
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
      syncModules(dependents, includeIgnored);
    }
  }, 500);

  file
    .watch(`${pkg.dir}${watchPattern}`)
    .filter((path) => !path.includes('node_modules/'))
    .forEach(() => sync());
}
