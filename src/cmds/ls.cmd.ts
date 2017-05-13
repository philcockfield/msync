import {
  log,
  loadSettings,
  ISettings,
  constants,
  table,
  IModule,
  filter,
  fsPath,
  semver,
} from '../common';


export const name = 'ls';
export const alias = 'l';
export const description = 'Lists modules in dependency order.';
export const args = {
  '-D': 'Show all module dependencies (omit for local only).',
  '-i': 'Include ignored modules.',
  '-p': 'Show path to module.',
  '-n': 'Retrieve registry details from NPM.',
  '--no-formatting': 'Simple list without table formatting.',
};


/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {
      D?: boolean;
      i?: boolean;
      p?: boolean;
      n?: boolean;
      formatting?: boolean;
    },
  },
) {
  const options = (args && args.options) || {};
  await ls({
    dependencies: options.D ? 'all' : 'local',
    includeIgnored: options.i,
    showPath: options.p,
    npm: options.n,
    formatting: options.formatting,
  });
}


export type DisplayDependencies = 'none' | 'local' | 'all';
export interface IOptions {
  basePath?: string;
  dependencies?: DisplayDependencies;
  includeIgnored?: boolean;
  showPath?: boolean;
  formatting?: boolean;
  dependants?: IModule[];
  npm?: boolean;
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
  const { includeIgnored = false, npm = false } = options;
  const formatting = options.formatting === false ? false : true;

  const settings = await loadSettings({ npm, spinner: npm });
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings
    .modules
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored));


  if (formatting) {
    // Pretty formatting.
    printTable(modules, {
      ...options,
      basePath: fsPath.dirname(settings.path),
      columns: options.columns,
    });
    log.info();

  } else {
    // No formatting.
    log.info();
    modules.forEach((pkg) => log.info(pkg.name));
    log.info();

  }

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
      render: (pkg: IModule) => {
        const npmVersion = pkg.npm && pkg.npm.latest;
        if (npmVersion && semver.gt(pkg.version, npmVersion)) {
          return log.yellow(`${pkg.version}`) + log.gray(` (NPM ${npmVersion})`);
        } else if (npmVersion && semver.lt(pkg.version, npmVersion)) {
          return log.gray(`${pkg.version}`) + log.magenta(` (NPM ${npmVersion})`);
        } else {
          return log.magenta(pkg.version);
        }
      },
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
  }
}
