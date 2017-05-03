import {
  log,
  loadSettings,
  ISettings,
  constants,
  table,
  IModule,
  filter,
  fsPath,
  npm,
  semver,
} from '../common';


export const name = 'ls';
export const alias = 'l';
export const description = 'List modules in dependency order.';
export const args = {
  '-D': 'Show all module dependencies.',
  '-d': 'Show local module dependencies only.',
  '-i': 'Include ignored modules.',
  '-p': 'Show path to module.',
  '-n': 'Retrieve registry details from NPM.',
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
      n?: boolean;
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
    queryNpm: options.n,
  });
}


export type DisplayDependencies = 'none' | 'local' | 'all';
export interface IOptions {
  basePath?: string;
  dependencies?: DisplayDependencies;
  includeIgnored?: boolean;
  showPath?: boolean;
  dependants?: IModule[];
  queryNpm?: boolean;
  columns?: ITableColumn[];
}

export interface ITableColumn {
  head?: string;
  render: (data: any) => string;
}


/**
 * List modules in dependency order.
 */
export async function ls(options: IOptions = {}) {
  const { includeIgnored = false, queryNpm = false } = options;

  const settings = await loadSettings();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings
    .modules
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored));

  const columns = [] as ITableColumn[];
  if (queryNpm) {
    const modulesNpmInfo = await npm.info(modules);
    columns.push({
      head: 'npm (latest)',
      render: (pkg: IModule) => {
        const info = modulesNpmInfo.find((item) => item.module.name === pkg.name);
        const msg = !info
          ? 'Not in registry'
          : semver.gt(pkg.version, info.latest)
            ? log.yellow(`${info.latest} ⬅`)
            : info.latest;
        return log.gray(msg);
      },
    });
  }

  printTable(modules, {
    ...options,
    basePath: fsPath.dirname(settings.path),
    columns: [...(options.columns || []), ...columns],
  });
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
    dependants,
    basePath,
    columns = [],
  } = options;
  const showAllDependencies = dependencies === 'all';
  const showDependants = dependants !== undefined;

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

  const listDependants = (dependants: IModule[]) => {
    if (!dependants || dependants.length === 0) { return log.yellow('dependant'); }
    return dependants
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

  const column: { [key: string]: ITableColumn } = {
    module: {
      head: 'module',
      render: (pkg: IModule) => log.cyan(pkg.name),
    },
    version: {
      head: 'version',
      render: (pkg: IModule) => log.magenta(pkg.version),
    },
    dependencies: {
      head: 'dependencies',
      render: (pkg: IModule) => listDependences(pkg, modules),
    },
    dependants: {
      head: 'dependants',
      render: (pkg: IModule) => listDependants(dependants || []),
    },
    path: {
      head: 'path',
      render: (pkg: IModule) => {
        const path = basePath && pkg.dir.startsWith(basePath)
          ? pkg.dir.substring(basePath.length, pkg.dir.length)
          : pkg.dir;
        return log.gray(path);
      },
    },
  };

  const logModules = (modules: IModule[]) => {
    const cols = [] as ITableColumn[];
    const addColumn = (col: ITableColumn, include = true) => include && cols.push(col);

    addColumn(column.module);
    addColumn(column.version);
    addColumn(column.dependencies, dependencies !== 'none');
    addColumn(column.dependants, showDependants);
    addColumn(column.path, showPath);
    (columns || []).forEach((col) => addColumn(col));

    const head = cols.map((col) => log.gray(col.head));
    const builder = table({ head });
    modules.forEach((pkg) => {
      const row = [] as string[];
      cols.forEach((col) => row.push(col.render(pkg)));
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
