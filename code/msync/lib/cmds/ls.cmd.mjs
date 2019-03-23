import { constants, filter, fs, loadSettings, log, semver } from '../common';
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
export async function cmd(args) {
    const options = (args && args.options) || {};
    await ls({
        dependencies: options.D ? 'all' : 'local',
        includeIgnored: options.i,
        showPath: options.p,
        npm: options.n,
        formatting: options.formatting,
    });
}
export async function ls(options = {}) {
    const { includeIgnored = false, npm = false } = options;
    const formatting = options.formatting === false ? false : true;
    const settings = await loadSettings({ npm, spinner: npm });
    if (!settings) {
        log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
        return;
    }
    const modules = settings.modules.filter(pkg => filter.includeIgnored(pkg, includeIgnored));
    if (formatting) {
        printTable(modules, Object.assign({}, options, { basePath: fs.dirname(settings.path), columns: options.columns }));
        log.info();
    }
    else {
        log.info();
        modules.forEach(pkg => log.info(pkg.name));
        log.info();
    }
    return {
        modules,
        settings: settings,
    };
}
export function printTable(modules, options = {}) {
    const { dependencies = 'none', includeIgnored = false, showPath = false, dependants, basePath, columns = [], } = options;
    const showAllDependencies = dependencies === 'all';
    const showDependants = dependants !== undefined;
    const listDependences = (pkg, modules) => pkg.dependencies
        .filter(dep => (showAllDependencies ? true : dep.isLocal))
        .filter(dep => (dep.package ? filter.includeIgnored(dep.package, includeIgnored) : true))
        .map(dep => {
        const isIgnored = dep.package && dep.package.isIgnored;
        const bullet = isIgnored ? log.gray('-') : log.magenta('-');
        const name = isIgnored
            ? log.gray(dep.name)
            : dep.isLocal
                ? log.cyan(dep.name)
                : log.gray(dep.name);
        return `${bullet} ${name} ${log.gray(dep.version)}`;
    })
        .join('\n');
    const listDependants = (dependants) => {
        if (!dependants || dependants.length === 0) {
            return log.yellow('dependant');
        }
        return dependants
            .filter(pkg => filter.includeIgnored(pkg, includeIgnored))
            .map(pkg => {
            const bullet = pkg.isIgnored ? log.gray('-') : log.magenta('-');
            const name = pkg.isIgnored ? log.gray(pkg.name) : log.cyan(pkg.name);
            return `${bullet} ${name} ${log.gray(pkg.version)}`;
        })
            .join('\n');
    };
    const column = {
        module: {
            head: 'module',
            render: (pkg) => log.cyan(pkg.name),
        },
        version: {
            head: 'version',
            render: (pkg) => {
                const npmVersion = pkg.npm && pkg.npm.latest;
                if (npmVersion && semver.gt(pkg.version, npmVersion)) {
                    return log.yellow(`${pkg.version}`) + log.gray(` (NPM ${npmVersion})`);
                }
                else if (npmVersion && semver.lt(pkg.version, npmVersion)) {
                    return log.gray(`${pkg.version}`) + log.magenta(` (NPM ${npmVersion})`);
                }
                else {
                    return log.magenta(pkg.version);
                }
            },
        },
        dependencies: {
            head: 'dependencies',
            render: (pkg) => listDependences(pkg, modules),
        },
        dependants: {
            head: 'dependants',
            render: (pkg) => listDependants(dependants || []),
        },
        path: {
            head: 'path',
            render: (pkg) => {
                const path = basePath && pkg.dir.startsWith(basePath)
                    ? pkg.dir.substring(basePath.length, pkg.dir.length)
                    : pkg.dir;
                return log.gray(path);
            },
        },
    };
    const logModules = (modules) => {
        const cols = [];
        const addColumn = (col, include = true) => include && cols.push(col);
        addColumn(column.module);
        addColumn(column.version);
        addColumn(column.dependencies, dependencies !== 'none');
        addColumn(column.dependants, showDependants);
        addColumn(column.path, showPath);
        (columns || []).forEach(col => addColumn(col));
        const head = cols.map(col => log.gray(col.head));
        const builder = log.table({ head });
        modules.forEach(pkg => {
            const row = [];
            cols.forEach(col => row.push(col.render(pkg)));
            builder.add(row);
        });
        builder.log();
    };
    if (modules.length > 0) {
        logModules(modules);
    }
}
