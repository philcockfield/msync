import {
  log,
  config,
  listr,
  copy,
  constants,
  IPackageObject,
  elapsed,
} from '../common';


export const name = 'sync';
export const alias = 's';
export const description = 'Syncs each module\'s dependency tree locally.';
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
  await sync({ ignored: options.i });
}



export interface IOptions {
  ignored?: boolean;
}



/**
 * Copies each module's dependency tree locally.
 */
export async function sync(options: IOptions = {}) {
  const { ignored = false } = options;
  const startedAt = new Date();
  const settings = await config.init();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }

  const localDeps = (pkg: IPackageObject) => pkg.dependencies.filter((dep) => dep.isLocal);
  const modules = settings
    .modules
    .filter((pkg) => localDeps(pkg).length > 0)
    .filter((pkg) => ignored ? true : !pkg.isIgnored);


  const sync = async (target: IPackageObject) => {
    for (const source of localDeps(target)) {
      if (source.package) {
        await copy.module(source.package, target);
      }
    }
  };

  const tasks = modules.map((pkg) => {
    const depNames = localDeps(pkg).map((dep) => ` ${log.cyan(dep.name)}`);
    return {
      title: `${log.magenta(pkg.name)} ${log.cyan('⬅')}${depNames}`,
      task: () => sync(pkg),
    };
  });

  try {
    const taskList = listr(tasks, { concurrent: false });
    await taskList.run();
    log.info.gray(elapsed(startedAt));
    log.info();

  } catch (error) {
    log.warn(log.yellow(`\nFailed while syncing module '${error.message}'.`));
  }

  // Finish up.
  return settings;
}
