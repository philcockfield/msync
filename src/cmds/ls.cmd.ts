import {
  log,
  loadSettings,
  ISettings,
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
  '-p': 'Show path to module.',
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
      p?: boolean;
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
    showPath: options.p,
  });
}


export type DisplayDependencies = 'none' | 'local' | 'all';
export interface IOptions {
  deps?: DisplayDependencies;
  includeIgnored?: boolean;
  showPath?: boolean;
}


/**
 * List modules in dependency order.
 */
export async function ls(options: IOptions = {}) {
  const { includeIgnored = false } = options;

  const settings = await loadSettings();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings
    .modules
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored));

  printTable(modules, options);
  return {
    modules,
    settings: settings as ISettings,
  };
}



export function printTable(modules: IModule[], options: IOptions = {}) {
  const { deps = 'none', includeIgnored = false, showPath = false } = options;
  const showDeps = deps !== 'none';
  const showAllDeps = deps === 'all';

  const listDeps = (pkg: IModule, modules: IModule[]) => pkg
    .dependencies
    .filter((dep) => showAllDeps ? true : dep.isLocal)
    .filter((dep) => dep.package ? filter.includeIgnored(dep.package, includeIgnored) : true)
    .map((dep) => {
      const isIgnored = dep.package && dep.package.isIgnored;
      const bullet = isIgnored ? log.gray('-') : log.magenta('-');
      const name = isIgnored
        ? log.gray(dep.name)
        : dep.isLocal ? log.cyan(dep.name) : log.gray(dep.name);
      return `${bullet} ${name} ${log.gray(dep.version)}`;
    })
    .join('\n');

  const logModules = (modules: IModule[]) => {
    const head = [] as string[];
    const addHeader = (label: string, include = true) => include && head.push(log.gray(label));
    addHeader('module');
    addHeader('version');
    addHeader('dependencies', deps !== 'none');
    addHeader('path', showPath);

    const builder = table({ head });
    modules.forEach((pkg) => {
      const name = pkg.isIgnored ? log.gray(pkg.name) : log.cyan(pkg.name);
      const row = [] as string[];
      const addRow = (label: string, include = true) => include && row.push(log.gray(label));
      addRow(name);
      addRow(log.magenta(pkg.version));
      addRow(listDeps(pkg, modules), showDeps);
      addRow(pkg.dir, showPath);
      builder.add(row);
    });
    builder.log();
  };

  // Finish up.
  if (modules.length > 0) {
    logModules(modules);
    log.info();
  }
}

