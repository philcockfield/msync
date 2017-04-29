import {
  log,
  config,
  constants,
  table,
  IPackageObject,
} from '../common';


export const name = 'ls';
export const alias = 'l';
export const description = 'List modules in dependency order.';
export const args = {
  '-D': 'Show all module dependencies.',
  '-d': 'Show local module dependencies only.',
};


/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {
      d?: boolean;
      D?: boolean;
    },
  },
) {

  const options = (args && args.options) || {};
  let deps: DisplayDependencies = 'none';
  if (options.d) { deps = 'local'; }
  if (options.D) { deps = 'all'; }

  await ls({ deps });
}


export type DisplayDependencies = 'none' | 'local' | 'all';
export interface IOptions {
  deps?: DisplayDependencies;
}


/**
 * List modules in dependency order.
 */
export async function ls(options: IOptions) {
  options = options || {};
  const { deps = 'none' } = options;
  const showDeps = deps !== 'none';
  const showAllDeps = deps === 'all';
  const settings = await config.init();

  const listDeps = (pkg: IPackageObject, modules: IPackageObject[]) => pkg
    .dependencies
    .filter((dep) => showAllDeps ? true : dep.isLocal)
    .map((dep) => `${log.magenta('-')} ${log.cyan(dep.name)} ${log.gray(dep.version)}`)
    .join('\n');


  const logModules = (modules: IPackageObject[]) => {
    const depsHeader = deps === 'none' ? undefined : log.gray('dependencies');
    const builder = table([log.gray('module'), log.gray('version'), depsHeader]);
    modules.forEach((pkg) => {
      if (showDeps) {
        builder.add(log.cyan(pkg.name), log.magenta(pkg.version), listDeps(pkg, modules));
      } else {
        builder.add(log.cyan(pkg.name), log.magenta(pkg.version));
      }
    });
    builder.log();
  };

  const modules = settings && settings.modules;
  if (modules && modules.length > 0) {
    logModules(modules);
    log.info();
  } else {
    log.warn.yellow(`No modules defined or the '${constants.CONFIG_FILE_NAME}' file not found.`);
  }

  // Finish up.
  return settings;
}
