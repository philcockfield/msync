import {
  log,
  config,
  constants,
  table,
  IModule,
  filter,
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
    includeIgnored: options.i,
  });
}


export type DisplayDependencies = 'none' | 'local' | 'all';
export interface IOptions {
  deps?: DisplayDependencies;
  includeIgnored?: boolean;
}


/**
 * List modules in dependency order.
 */
export async function ls(options: IOptions = {}) {
  const { includeIgnored = false } = options;

  const settings = await config.init();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings
    .modules
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored));

  printTable(modules, options);
  return { modules, settings };
}


export interface IPrintOptions { }

export function printTable(modules: IModule[], options: IOptions = {}) {
  const { deps = 'none', includeIgnored = false } = options;
  const showDeps = deps !== 'none';
  const showAllDeps = deps === 'all';

  const listDeps = (pkg: IModule, modules: IModule[]) => pkg
    .dependencies
    .filter((dep) => showAllDeps ? true : dep.isLocal)
    .filter((dep) => dep.package ? filter.includeIgnored(dep.package, includeIgnored) : true)
    .map((dep) => {
      const isIgnored = dep.package && dep.package.isIgnored;
      const bullet = isIgnored ? log.gray('-') : log.magenta('-');
      const name = isIgnored ? log.gray(dep.name) : log.cyan(dep.name);
      return `${bullet} ${name} ${log.gray(dep.version)}`;
    })
    .join('\n');

  const logModules = (modules: IModule[]) => {
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
}

