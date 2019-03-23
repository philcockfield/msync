"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var common_1 = require("../common");
exports.name = 'ls';
exports.alias = 'l';
exports.description = 'Lists modules in dependency order.';
exports.args = {
    '-D': 'Show all module dependencies (omit for local only).',
    '-i': 'Include ignored modules.',
    '-p': 'Show path to module.',
    '-n': 'Retrieve registry details from NPM.',
    '--no-formatting': 'Simple list without table formatting.',
};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var options;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = (args && args.options) || {};
                    return [4, ls({
                            dependencies: options.D ? 'all' : 'local',
                            includeIgnored: options.i,
                            showPath: options.p,
                            npm: options.n,
                            formatting: options.formatting,
                        })];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.cmd = cmd;
function ls(options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, includeIgnored, _b, npm, formatting, settings, modules;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = options.includeIgnored, includeIgnored = _a === void 0 ? false : _a, _b = options.npm, npm = _b === void 0 ? false : _b;
                    formatting = options.formatting === false ? false : true;
                    return [4, common_1.loadSettings({ npm: npm, spinner: npm })];
                case 1:
                    settings = _c.sent();
                    if (!settings) {
                        common_1.log.warn.yellow(common_1.constants.CONFIG_NOT_FOUND_ERROR);
                        return [2];
                    }
                    modules = settings.modules.filter(function (pkg) { return common_1.filter.includeIgnored(pkg, includeIgnored); });
                    if (formatting) {
                        printTable(modules, tslib_1.__assign({}, options, { basePath: common_1.fs.dirname(settings.path), columns: options.columns }));
                        common_1.log.info();
                    }
                    else {
                        common_1.log.info();
                        modules.forEach(function (pkg) { return common_1.log.info(pkg.name); });
                        common_1.log.info();
                    }
                    return [2, {
                            modules: modules,
                            settings: settings,
                        }];
            }
        });
    });
}
exports.ls = ls;
function printTable(modules, options) {
    if (options === void 0) { options = {}; }
    var _a = options.dependencies, dependencies = _a === void 0 ? 'none' : _a, _b = options.includeIgnored, includeIgnored = _b === void 0 ? false : _b, _c = options.showPath, showPath = _c === void 0 ? false : _c, dependants = options.dependants, basePath = options.basePath, _d = options.columns, columns = _d === void 0 ? [] : _d;
    var showAllDependencies = dependencies === 'all';
    var showDependants = dependants !== undefined;
    var listDependences = function (pkg, modules) {
        return pkg.dependencies
            .filter(function (dep) { return (showAllDependencies ? true : dep.isLocal); })
            .filter(function (dep) { return (dep.package ? common_1.filter.includeIgnored(dep.package, includeIgnored) : true); })
            .map(function (dep) {
            var isIgnored = dep.package && dep.package.isIgnored;
            var bullet = isIgnored ? common_1.log.gray('-') : common_1.log.magenta('-');
            var name = isIgnored
                ? common_1.log.gray(dep.name)
                : dep.isLocal
                    ? common_1.log.cyan(dep.name)
                    : common_1.log.gray(dep.name);
            return bullet + " " + name + " " + common_1.log.gray(dep.version);
        })
            .join('\n');
    };
    var listDependants = function (dependants) {
        if (!dependants || dependants.length === 0) {
            return common_1.log.yellow('dependant');
        }
        return dependants
            .filter(function (pkg) { return common_1.filter.includeIgnored(pkg, includeIgnored); })
            .map(function (pkg) {
            var bullet = pkg.isIgnored ? common_1.log.gray('-') : common_1.log.magenta('-');
            var name = pkg.isIgnored ? common_1.log.gray(pkg.name) : common_1.log.cyan(pkg.name);
            return bullet + " " + name + " " + common_1.log.gray(pkg.version);
        })
            .join('\n');
    };
    var column = {
        module: {
            head: 'module',
            render: function (pkg) { return common_1.log.cyan(pkg.name); },
        },
        version: {
            head: 'version',
            render: function (pkg) {
                var npmVersion = pkg.npm && pkg.npm.latest;
                if (npmVersion && common_1.semver.gt(pkg.version, npmVersion)) {
                    return common_1.log.yellow("" + pkg.version) + common_1.log.gray(" (NPM " + npmVersion + ")");
                }
                else if (npmVersion && common_1.semver.lt(pkg.version, npmVersion)) {
                    return common_1.log.gray("" + pkg.version) + common_1.log.magenta(" (NPM " + npmVersion + ")");
                }
                else {
                    return common_1.log.magenta(pkg.version);
                }
            },
        },
        dependencies: {
            head: 'dependencies',
            render: function (pkg) { return listDependences(pkg, modules); },
        },
        dependants: {
            head: 'dependants',
            render: function (pkg) { return listDependants(dependants || []); },
        },
        path: {
            head: 'path',
            render: function (pkg) {
                var path = basePath && pkg.dir.startsWith(basePath)
                    ? pkg.dir.substring(basePath.length, pkg.dir.length)
                    : pkg.dir;
                return common_1.log.gray(path);
            },
        },
    };
    var logModules = function (modules) {
        var cols = [];
        var addColumn = function (col, include) {
            if (include === void 0) { include = true; }
            return include && cols.push(col);
        };
        addColumn(column.module);
        addColumn(column.version);
        addColumn(column.dependencies, dependencies !== 'none');
        addColumn(column.dependants, showDependants);
        addColumn(column.path, showPath);
        (columns || []).forEach(function (col) { return addColumn(col); });
        var head = cols.map(function (col) { return common_1.log.gray(col.head); });
        var builder = common_1.log.table({ head: head });
        modules.forEach(function (pkg) {
            var row = [];
            cols.forEach(function (col) { return row.push(col.render(pkg)); });
            builder.add(row);
        });
        builder.log();
    };
    if (modules.length > 0) {
        logModules(modules);
    }
}
exports.printTable = printTable;
