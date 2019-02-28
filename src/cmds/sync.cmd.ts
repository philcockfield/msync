import { debounceTime, filter } from 'rxjs/operators';

import {
  constants,
  copy,
  dependsOn,
  elapsed,
  file,
  filter as filterUtil,
  fsPath,
  IDependency,
  IModule,
  ISettings,
  listr,
  loadSettings,
  log,
  moment,
  updatePackageRef,
  util,
} from '../common';
import * as listCommand from './ls.cmd';

export const name = 'sync';
export const alias = ['s', 'sl'];
export const description = 'Syncs each module\'s dependency tree within the workspace.';
export const args = {
  '-i': 'Include ignored modules.',
  '-w': 'Sync on changes to files.',
  '-v': 'Update version reference in package.json files.',
};

/**
 * CLI command.
 */
export async function cmd(args?: {
  params: string[];
  options: {
    i?: boolean;
    w?: boolean;
    v?: boolean;
  };
}) {
  const options = (args && args.options) || {};
  const watch = options.w || false;
  const includeIgnored = options.i || false;
  const updateVersions = options.v || false;
  const config = { includeIgnored, updateVersions };
  if (watch) {
    await syncWatch(config);
  } else {
    await sync(config);
  }
}

export interface ISyncOptions {
  includeIgnored?: boolean;
  updateVersions?: boolean;
  silent?: boolean;
}

/**
 * Copies each module's dependency tree locally.
 */
export async function sync(options: ISyncOptions = {}) {
  const { includeIgnored = false } = options;
  const write = (msg: any) => util.write(msg, options.silent);
  const settings = await loadSettings();
  if (!settings) {
    write(log.yellow(constants.CONFIG_NOT_FOUND_ERROR));
    return;
  }

  const modules = settings.modules
    .filter(pkg => filterUtil.localDeps(pkg).length > 0)
    .filter(pkg => filterUtil.includeIgnored(pkg, includeIgnored));

  // Finish up.
  await syncModules(modules, options);
  return {
    settings: settings as ISettings,
    modules,
  };
}

/**
 * Syncs the given set of modules.
 */
export async function syncModules(modules: IModule[], options: ISyncOptions = {}) {
  const startedAt = new Date();
  const { includeIgnored = false, updateVersions = false, silent = false } = options;
  const write = (msg: any) => util.write(msg, options.silent);

  const sync = async (sources: IDependency[], target: IModule) => {
    for (const source of sources) {
      if (source.package) {
        await copy.module(source.package, target);
        await copy.logUpdate(target);

        if (updateVersions) {
          await updatePackageRef(target, source.package.name, source.package.version, {
            save: true,
          });
        }
      }
    }
  };

  const tasks = modules.map(target => {
    const sources = filterUtil
      .localDeps(target)
      .filter(dep => filterUtil.includeIgnored(dep.package, includeIgnored));
    const sourceNames = sources.map(dep => ` ${log.cyan(dep.name)}`);
    const title = `${log.magenta(target.name)} ${log.cyan(
      sourceNames.length > 0 ? '⬅' : '',
    )}${sourceNames}`;
    return {
      title,
      task: () => sync(sources, target),
    };
  });

  try {
    if (silent) {
      // Run the tasks silently.
      for (const item of tasks) {
        await item.task();
      }
    } else {
      // Run the tasks with a visual spinner output.
      const taskList = listr(tasks, { concurrent: false });
      await taskList.run();
      write(log.gray(` ${elapsed(startedAt)}, ${moment().format('h:mm:ssa')}`));
      write('');
    }
  } catch (error) {
    write(log.yellow(`\nFailed while syncing module '${error.message}'.`));
  }

  // Finish up.
  return modules;
}

/**
 * Copies each module's dependency tree locally.
 */
export async function syncWatch(options: ISyncOptions = {}) {
  // Setup initial conditions.
  const { includeIgnored = false, silent = false } = options;
  const write = (msg: any) => util.write(msg, options.silent);
  write(log.magenta('\nSync watching:'));
  const result = await listCommand.ls({
    dependencies: 'local',
    includeIgnored,
  });
  if (!result) {
    return;
  }
  const { modules, settings } = result;

  // Start the watcher for each module.
  modules.forEach(pkg => watch(pkg, modules, settings.watchPattern, includeIgnored, silent));
}

/**
 * Watches and syncs a single module.
 */
function watch(
  pkg: IModule,
  modules: IModule[],
  watchPattern: string,
  includeIgnored: boolean,
  silent: boolean,
) {
  const sync = () => {
    const dependants = dependsOn(pkg, modules);
    if (dependants.length > 0) {
      util.write(log.green(`${pkg.name} changed: `), silent);
      syncModules(dependants, { includeIgnored });
    }
  };

  file
    .watch(fsPath.join(pkg.dir, watchPattern))
    .pipe(
      filter(path => !path.includes('node_modules/')),
      debounceTime(1000),
    )
    .subscribe(() => sync());
}
