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
  let dependencies: DisplayDependencies = 'none';
  if (options.d) { dependencies = 'local'; }
  if (options.D) { dependencies = 'all'; }

  await ls({
    dependencies,
    includeIgnored: options.i,
    showPath: options.p,
  });
}


export type DisplayDependencies = 'none' | 'local' | 'all';
export interface IOptions {
  dependencies?: DisplayDependencies;
  includeIgnored?: boolean;
  showPath?: boolean;
  dependents?: IModule[];
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
  const {
    dependencies = 'none',
    includeIgnored = false,
    showPath = false,
    dependents,
  } = options;
  const showDependencies = dependencies !== 'none';
  const showAllDependencies = dependencies === 'all';
  const showDependents = dependents !== undefined;

  const listDependences = (pkg: IModule, modules: IModule[]) => pkg
    .dependencies
    .filter((dep) => showAllDependencies ? true : dep.isLocal)
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

  const listDependents = (dependents: IModule[]) => {
    if (!dependents || dependents.length === 0) { return log.yellow('No dependent modules.'); }
    return dependents
      .filter((pkg) => filter.includeIgnored(pkg, includeIgnored))
      .map((pkg) => {
        const bullet = pkg.isIgnored ? log.gray('-') : log.magenta('-');
        const name = pkg.isIgnored
          ? log.gray(pkg.name)
          : log.cyan(pkg.name);
        return `${bullet} ${name} ${log.gray(pkg.version)}`;
      })
      .join('\n');
  };

  const logModules = (modules: IModule[]) => {
    const head = [] as string[];
    const addHeader = (label: string, include = true) => include && head.push(log.gray(label));
    addHeader('module');
    addHeader('version');
    addHeader('dependencies', dependencies !== 'none');
    addHeader('dependents', showDependents);
    addHeader('path', showPath);

    const builder = table({ head });
    modules.forEach((pkg) => {
      // const dependents = showDependents && dependsOn(pkg, allModules);
      const name = pkg.isIgnored ? log.gray(pkg.name) : log.cyan(pkg.name);
      const row = [] as string[];
      const addRow = (label: string, include = true) => include && row.push(log.gray(label));
      addRow(name);
      addRow(log.magenta(pkg.version));
      addRow(listDependences(pkg, modules), showDependencies);
      addRow(listDependents(dependents || []), showDependents);
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
