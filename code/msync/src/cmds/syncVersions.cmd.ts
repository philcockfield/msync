import {
  constants,
  elapsed,
  filter as filterUtil,
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

export const name = 'sync-versions';
export const alias = ['v', 'sv'];
export const description = 'Updates version reference in package.json files.';
export const args = {
  '-i': 'Include ignored modules.',
};

/**
 * CLI command.
 */
export async function cmd(args?: { params: string[]; options: { i?: boolean } }) {
  const options = (args && args.options) || {};
  const includeIgnored = options.i || false;
  const config = { includeIgnored };
  await syncVersions(config);
}

export interface ISyncVersionOptions {
  includeIgnored?: boolean;
  silent?: boolean;
}

/**
 * Copies each module's dependency tree locally.
 */
export async function syncVersions(options: ISyncVersionOptions = {}) {
  const { includeIgnored = false } = options;
  const write = (msg: any) => util.write(msg, options.silent);
  const settings = await loadSettings();
  if (!settings) {
    write(log.yellow(constants.CONFIG_NOT_FOUND_ERROR));
    return;
  }

  const modules = settings.modules
    .filter((pkg) => filterUtil.localDeps(pkg).length > 0)
    .filter((pkg) => filterUtil.includeIgnored(pkg, includeIgnored));

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
async function syncModules(modules: IModule[], options: ISyncVersionOptions = {}) {
  const startedAt = new Date();
  const { includeIgnored = false, silent = false } = options;

  const write = (msg: any) => util.write(msg, options.silent);

  const sync = async (sources: IDependency[], target: IModule) => {
    for (const source of sources) {
      if (source.package) {
        await updatePackageRef(target, source.package.name, source.package.version, { save: true });
      }
    }
  };

  const tasks = modules.map((target) => {
    const sources = filterUtil
      .localDeps(target)
      .filter((dep) => filterUtil.includeIgnored(dep.package, includeIgnored));
    const title = log.magenta(target.name);
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
