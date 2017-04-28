import {
  log,
  file,
  config,
  printTitle,
  constants,
  IPackageObject,
  table,
} from '../common';



export const name = 'ls';
export const description = 'Lists modules.';
export const args = {
  '--deps, -d': 'Show module depencies (depth first).',
};


export async function cmd(
  args?: {
    params: string[],
    options: {},
  },
) {

  const options = (args && args.options) || {} as any;
  const showDeps = (options.deps || options.d) || false;
  const settings = await config.init();

  const listDeps = (pkg: IPackageObject) => pkg
    .dependencies
    .map((dep) => `${log.magenta('-')} ${log.cyan(dep.name)}`)
    .join('\n');


  const logModules = (modules: IPackageObject[]) => {
    const builder = table([log.gray('module'), log.gray('version'), showDeps && log.gray('dependencies')]);
    modules.forEach((pkg) => {
      if (showDeps) {
        builder.add(log.cyan(pkg.name), log.magenta(pkg.version), listDeps(pkg));
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
