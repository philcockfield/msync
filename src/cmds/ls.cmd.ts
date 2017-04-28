import {
  log,
  file,
  config,
  printTitle,
  constants,
  table,
  orderByDepth,
  IPackageObject,
  IDependency,
} from '../common';


export const name = 'ls';
export const description = 'List modules in dependency order.';
export const args = {
  '-D': 'Show all module dependencies.',
  '-d': 'Show local module dependencies only.',
};


export async function cmd(
  args?: {
    params: string[],
    options: {},
  },
) {

  const options = (args && args.options) || {} as any;
  const showDeps = (options.d || options.D) || false;
  const showAllDeps = (options.D) || false;
  const settings = await config.init();

  const listDeps = (pkg: IPackageObject, modules: IPackageObject[]) => pkg
    .dependencies
    .filter((dep) => showAllDeps ? true : dep.isLocal)
    .map((dep) => `${log.magenta('-')} ${log.cyan(dep.name)} ${log.gray(dep.version)}`)
    .join('\n');


  const logModules = (modules: IPackageObject[]) => {
    const builder = table([log.gray('module'), log.gray('version'), showDeps && log.gray('dependencies')]);
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
}
