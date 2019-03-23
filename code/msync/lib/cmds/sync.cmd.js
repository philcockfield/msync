"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var operators_1 = require("rxjs/operators");
var common_1 = require("../common");
var listCommand = require("./ls.cmd");
exports.name = 'sync';
exports.alias = ['s', 'sl'];
exports.description = "Syncs each module's dependency tree within the workspace.";
exports.args = {
    '-i': 'Include ignored modules.',
    '-w': 'Sync on changes to files.',
    '-v': 'Update version reference in package.json files.',
};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var options, watch, includeIgnored, updateVersions, config;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = (args && args.options) || {};
                    watch = options.w || false;
                    includeIgnored = options.i || false;
                    updateVersions = options.v || false;
                    config = { includeIgnored: includeIgnored, updateVersions: updateVersions };
                    if (!watch) return [3, 2];
                    return [4, syncWatch(config)];
                case 1:
                    _a.sent();
                    return [3, 4];
                case 2: return [4, sync(config)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2];
            }
        });
    });
}
exports.cmd = cmd;
function sync(options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, includeIgnored, write, settings, modules;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = options.includeIgnored, includeIgnored = _a === void 0 ? false : _a;
                    write = function (msg) { return common_1.util.write(msg, options.silent); };
                    return [4, common_1.loadSettings()];
                case 1:
                    settings = _b.sent();
                    if (!settings) {
                        write(common_1.log.yellow(common_1.constants.CONFIG_NOT_FOUND_ERROR));
                        return [2];
                    }
                    modules = settings.modules
                        .filter(function (pkg) { return common_1.filter.localDeps(pkg).length > 0; })
                        .filter(function (pkg) { return common_1.filter.includeIgnored(pkg, includeIgnored); });
                    return [4, syncModules(modules, options)];
                case 2:
                    _b.sent();
                    return [2, {
                            settings: settings,
                            modules: modules,
                        }];
            }
        });
    });
}
exports.sync = sync;
function syncModules(modules, options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var startedAt, _a, includeIgnored, _b, updateVersions, _c, silent, write, sync, tasks, _i, tasks_1, item, taskList, error_1;
        var _this = this;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    startedAt = new Date();
                    _a = options.includeIgnored, includeIgnored = _a === void 0 ? false : _a, _b = options.updateVersions, updateVersions = _b === void 0 ? false : _b, _c = options.silent, silent = _c === void 0 ? false : _c;
                    write = function (msg) { return common_1.util.write(msg, options.silent); };
                    sync = function (sources, target) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var _i, sources_1, source;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _i = 0, sources_1 = sources;
                                    _a.label = 1;
                                case 1:
                                    if (!(_i < sources_1.length)) return [3, 7];
                                    source = sources_1[_i];
                                    if (!source.package) return [3, 6];
                                    return [4, common_1.copy.module(source.package, target)];
                                case 2:
                                    _a.sent();
                                    return [4, common_1.copy.logUpdate(target)];
                                case 3:
                                    _a.sent();
                                    return [4, chmod(target)];
                                case 4:
                                    _a.sent();
                                    if (!updateVersions) return [3, 6];
                                    return [4, common_1.updatePackageRef(target, source.package.name, source.package.version, {
                                            save: true,
                                        })];
                                case 5:
                                    _a.sent();
                                    _a.label = 6;
                                case 6:
                                    _i++;
                                    return [3, 1];
                                case 7: return [2];
                            }
                        });
                    }); };
                    tasks = modules.map(function (target) {
                        var sources = common_1.filter
                            .localDeps(target)
                            .filter(function (dep) { return common_1.filter.includeIgnored(dep.package, includeIgnored); });
                        var sourceNames = sources.map(function (dep) { return " " + common_1.log.cyan(dep.name); });
                        var title = common_1.log.magenta(target.name) + " " + common_1.log.cyan(sourceNames.length > 0 ? '⬅' : '') + sourceNames;
                        return {
                            title: title,
                            task: function () { return sync(sources, target); },
                        };
                    });
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 9, , 10]);
                    if (!silent) return [3, 6];
                    _i = 0, tasks_1 = tasks;
                    _d.label = 2;
                case 2:
                    if (!(_i < tasks_1.length)) return [3, 5];
                    item = tasks_1[_i];
                    return [4, item.task()];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3, 2];
                case 5: return [3, 8];
                case 6:
                    taskList = common_1.listr(tasks, { concurrent: false });
                    return [4, taskList.run()];
                case 7:
                    _d.sent();
                    write(common_1.log.gray(" " + common_1.elapsed(startedAt) + ", " + common_1.moment().format('h:mm:ssa')));
                    write('');
                    _d.label = 8;
                case 8: return [3, 10];
                case 9:
                    error_1 = _d.sent();
                    write(common_1.log.yellow("\nFailed while syncing module '" + error_1.message + "'."));
                    return [3, 10];
                case 10: return [2, modules];
            }
        });
    });
}
exports.syncModules = syncModules;
function chmod(module) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var dir, cmd, files, wait;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dir = common_1.fs.join(module.dir, 'node_modules/.bin');
                    return [4, common_1.fs.pathExistsSync(dir)];
                case 1:
                    if (!(_a.sent())) {
                        return [2, []];
                    }
                    cmd = common_1.exec.command("chmod 777");
                    return [4, common_1.fs.readdir(dir)];
                case 2:
                    files = (_a.sent()).map(function (name) { return common_1.fs.join(dir, name); });
                    wait = files.map(function (path) {
                        return cmd
                            .clone()
                            .add(path)
                            .run({ silent: true });
                    });
                    return [4, Promise.all(wait)];
                case 3:
                    _a.sent();
                    return [2, files];
            }
        });
    });
}
exports.chmod = chmod;
function syncWatch(options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, includeIgnored, _b, silent, write, result, modules, settings;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = options.includeIgnored, includeIgnored = _a === void 0 ? false : _a, _b = options.silent, silent = _b === void 0 ? false : _b;
                    write = function (msg) { return common_1.util.write(msg, options.silent); };
                    write(common_1.log.magenta('\nSync watching:'));
                    return [4, listCommand.ls({
                            dependencies: 'local',
                            includeIgnored: includeIgnored,
                        })];
                case 1:
                    result = _c.sent();
                    if (!result) {
                        return [2];
                    }
                    modules = result.modules, settings = result.settings;
                    modules.forEach(function (pkg) { return watch(pkg, modules, settings.watchPattern, includeIgnored, silent); });
                    return [2];
            }
        });
    });
}
exports.syncWatch = syncWatch;
function watch(pkg, modules, watchPattern, includeIgnored, silent) {
    var sync = function () {
        var dependants = common_1.dependsOn(pkg, modules);
        if (dependants.length > 0) {
            common_1.util.write(common_1.log.green(pkg.name + " changed: "), silent);
            syncModules(dependants, { includeIgnored: includeIgnored });
        }
    };
    common_1.file
        .watch(common_1.fs.join(pkg.dir, watchPattern))
        .pipe(operators_1.filter(function (path) { return !path.includes('node_modules/'); }), operators_1.debounceTime(1000))
        .subscribe(function () { return sync(); });
}
