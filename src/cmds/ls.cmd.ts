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
  '-i': 'Include ignored modules.',
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
      i?: boolean;
    },
  },
) {

  const options = (args && args.options) || {};
  let deps: DisplayDependencies = 'none';
  if (options.d) { deps = 'local'; }
  if (options.D) { deps = 'all'; }

  await ls({
    deps,
    ignored: options.i,
  });
}


export type DisplayDependencies = 'none' | 'local' | 'all';
export interface IOptions {
  deps?: DisplayDependencies;
  ignored?: boolean;
}


/**
 * List modules in dependency order.
 */
export async function ls(options: IOptions = {}) {
  const { deps = 'none', ignored = false } = options;
  const showDeps = deps !== 'none';
  const showAllDeps = deps === 'all';

  const settings = await config.init();
  if (!settings) {
    log.warn.yellow(`No modules defined or the '${constants.CONFIG_FILE_NAME}' file not found.`);
    return;
  }
  const filterIgnored = (pkg: IPackageObject) => ignored ? true : !pkg.isIgnored;
  const modules = settings
    .modules
    .filter((pkg) => filterIgnored(pkg));

  const listDeps = (pkg: IPackageObject, modules: IPackageObject[]) => pkg
    .dependencies
    .filter((dep) => showAllDeps ? true : dep.isLocal)
    .filter((dep) => dep.package ? filterIgnored(dep.package) : true)
    .map((dep) => {
      const isIgnored = dep.package && dep.package.isIgnored;
      const bullet = isIgnored ? log.gray('-') : log.magenta('-');
      const name = isIgnored ? log.gray(dep.name) : log.cyan(dep.name);
      return `${bullet} ${name} ${log.gray(dep.version)}`;
    })
    .join('\n');

  const logModules = (modules: IPackageObject[]) => {
    const depsHeader = deps === 'none' ? undefined : log.gray('dependencies');
    const builder = table([log.gray('module'), log.gray('version'), depsHeader]);
    modules.forEach((pkg) => {
      const name = pkg.isIgnored ? log.gray(pkg.name) : log.cyan(pkg.name);
      if (showDeps) {
        builder.add(name, log.magenta(pkg.version), listDeps(pkg, modules));
      } else {
        builder.add(name, log.magenta(pkg.version));
      }
    });
    builder.log();
  };

  // Finish up.
  if (modules.length > 0) {
    logModules(modules);
    log.info();
  }
  return settings;
}
