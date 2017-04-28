import {
  log,
  config,
  listr,
  copy,
  constants,
  IPackageObject,
} from '../common';


export const name = 'sync';
export const alias = 's';
export const description = 'Copies each module\'s dependency tree locally.';
export const args = {
};



/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {},
  },
) {
  await syncAll();
}




/**
 * Copies each module's dependency tree locally.
 */
export async function syncAll() {
  const settings = await config.init();
  if (!settings) {
    log.warn.yellow(`No modules defined or the '${constants.CONFIG_FILE_NAME}' file not found.`);
    return;
  }

  const localDeps = (pkg: IPackageObject) => pkg.dependencies.filter((dep) => dep.isLocal);
  const modules = settings
    .modules
    .filter((pkg) => localDeps(pkg).length > 0);


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
      title: `${log.magenta(pkg.name)}${depNames}`,
      task: () => sync(pkg),
    };
  });

  try {
    const taskList = listr(tasks, { concurrent: false });
    await taskList.run();
    log.info();

  } catch (error) {
    log.warn(log.yellow(`\nFailed while syncing module '${error.message}'.`));
  }

  // Finish up.
  return settings;
}
