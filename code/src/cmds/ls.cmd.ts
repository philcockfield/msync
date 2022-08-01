import {
  constants,
  filter,
  formatModuleName,
  fs,
  IModule,
  loadSettings,
  log,
  semver,
  t,
  time,
} from '../common';

export const name = 'ls';
export const alias = 'l';
export const description = 'Lists modules in dependency order.';
export const args = {
  '-D': 'Show all module dependencies (omit for local only).',
  '-i': 'Include ignored modules.',
  '-p': 'Show path to module.',
  '-n': 'Retrieve registry details from NPM.',
  '--save': 'Save to a json file (within the directory)',
  '--no-formatting': 'Simple list without table formatting.',
};

/**
 * CLI command.
 */
export async function cmd(args?: {
  params: string[];
  options: {
    D?: boolean;
    i?: boolean;
    p?: boolean;
    n?: boolean;
    formatting?: boolean;
    save?: boolean | string;
  };
}) {
  const options = (args && args.options) || {};
  await ls({
    dependencies: options.D ? 'all' : 'local',
    includeIgnored: options.i,
    showPath: options.p,
    npm: options.n,
    formatting: options.formatting,
    savePath: Util.formatSavePath(options.save),
  });
}

export type DisplayDependencies = 'none' | 'local' | 'all';

export interface TableColumn {
  head?: string;
  render: (data: any) => string;
}

export interface ListOptions {
  basePath?: string;
  dependencies?: DisplayDependencies;
  includeIgnored?: boolean;
  showPath?: boolean;
  formatting?: boolean;
  dependants?: IModule[];
  npm?: boolean;
  columns?: TableColumn[];
  savePath?: string;
}

/**
 * List modules in dependency order.
 */
export async function ls(options: ListOptions = {}) {
  const { includeIgnored = false, npm = false, savePath } = options;
  const formatting = options.formatting === false ? false : true;

  const settings = await loadSettings({ npm, spinner: npm });
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }

  const modules = settings.modules.filter((pkg) => filter.includeIgnored(pkg, includeIgnored));

  if (formatting) {
    // Pretty formatting.
    printTable(modules, {
      ...options,
      basePath: fs.dirname(settings.path),
      columns: options.columns,
    });
    log.info();
  } else {
    // No formatting.
    log.info();
    modules.forEach((pkg) => log.info(pkg.name));
    log.info();
  }

  if (savePath) {
    const obj = Util.toJson(modules);
    const json = `${JSON.stringify(obj, null, '  ')}\n`;
    await fs.writeFile(fs.resolve(savePath), json);
  }

  return {
    modules,
    settings,
  };
}

export function printTable(modules: IModule[], options: ListOptions = {}) {
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

  const listDependences = (pkg: IModule, modules: IModule[]) =>
    pkg.dependencies
      .filter((dep) => (showAllDependencies ? true : dep.isLocal))
      .filter((dep) => (dep.package ? filter.includeIgnored(dep.package, includeIgnored) : true))
      .map((dep) => {
        const isIgnored = dep.package && dep.package.isIgnored;
        // const bullet = isIgnored ? log.gray('-') : log.magenta('-');
        const name = isIgnored
          ? log.gray(dep.name)
          : dep.isLocal
          ? log.cyan(dep.name)
          : log.gray(dep.name);
        return `${name} ${log.gray(dep.version)}`;
      })
      .join('\n');

  const listDependants = (dependants: IModule[]) => {
    if (!dependants || dependants.length === 0) {
      return log.yellow('dependant');
    }
    return dependants
      .filter((pkg) => filter.includeIgnored(pkg, includeIgnored))
      .map((pkg) => {
        const name = pkg.isIgnored ? log.gray(pkg.name) : formatModuleName(pkg.name);
        return `${name} ${log.gray(pkg.version)}`;
      })
      .join('\n');
  };

  const column: { [key: string]: TableColumn } = {
    module: {
      head: 'module',
      render: (pkg: IModule) => {
        const text = formatModuleName(pkg.name);
        return `  ${text}`;
      },
    },
    version: {
      head: 'version  ',
      render: (pkg: IModule) => {
        const npmVersion = pkg.npm && pkg.npm.latest;

        type Color = (input: string) => string;
        const format = (args: {
          from: { text: string; color: Color };
          to: { text: string; color: Color };
        }) => {
          const { from, to } = args;
          const max = Math.max(from.text.length, 12);
          const left = `${from.text}                   `.substring(0, max);
          const right = to.color(`← NPM ${to.text}`);
          return `${from.color(left)} ${right}`;
        };

        if (npmVersion && semver.gt(pkg.version, npmVersion)) {
          return format({
            from: { text: pkg.version, color: log.yellow },
            to: { text: npmVersion, color: log.gray },
          });
        } else if (npmVersion && semver.lt(pkg.version, npmVersion)) {
          return format({
            from: { text: pkg.version, color: log.gray },
            to: { text: npmVersion, color: log.magenta },
          });
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
        const path =
          basePath && pkg.dir.startsWith(basePath)
            ? pkg.dir.substring(basePath.length, pkg.dir.length)
            : pkg.dir;
        return log.gray(path);
      },
    },
  };

  const logModules = (modules: IModule[]) => {
    const cols = [] as TableColumn[];
    const addColumn = (col: TableColumn, include = true) => {
      if (include) {
        cols.push(col);
      }
    };

    addColumn(column.module);
    addColumn(column.version);
    addColumn(column.dependencies, dependencies !== 'none');
    addColumn(column.dependants, showDependants);
    addColumn(column.path, showPath);
    (columns || []).forEach((col) => addColumn(col));

    const head = cols.map((col) => log.gray(col.head));
    const builder = log.table({ head, border: false });
    modules.forEach((pkg) => {
      const row = [] as string[];
      cols.forEach((col) => row.push(`${col.render(pkg)}  `));
      builder.add(row);
    });
    builder.log();
  };

  // Finish up.
  if (modules.length > 0) {
    logModules(modules);
  }
}

/**
 * [Helpers]
 */

const Util = {
  formatSavePath(input?: boolean | string) {
    if (!input) return undefined;
    if (input === true) return 'msync.deps.json';

    if (typeof input === 'string') {
      const text = (input || '')
        .toString()
        .trim()
        .replace(/^\/*/, '')
        .replace(/\.json$/, '');
      return `${text}.json`;
    }

    return undefined;
  },

  toJson(modules: t.IModule[]): t.IModulesJson {
    const json: t.IModulesJson = {
      timestamp: time.now.timestamp,
      modules: modules.map((module) => {
        const { name, version, dir } = module;
        return { name, version, dir };
      }),
    };

    return json;
  },
};
