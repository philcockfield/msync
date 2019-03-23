"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var common_1 = require("../common");
exports.name = 'sync-versions';
exports.alias = ['v', 'sv'];
exports.description = 'Updates version reference in package.json files.';
exports.args = {
    '-i': 'Include ignored modules.',
};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var options, includeIgnored, config;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = (args && args.options) || {};
                    includeIgnored = options.i || false;
                    config = { includeIgnored: includeIgnored };
                    return [4, syncVersions(config)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.cmd = cmd;
function syncVersions(options) {
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
exports.syncVersions = syncVersions;
function syncModules(modules, options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var startedAt, _a, includeIgnored, _b, silent, write, sync, tasks, _i, tasks_1, item, taskList, error_1;
        var _this = this;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    startedAt = new Date();
                    _a = options.includeIgnored, includeIgnored = _a === void 0 ? false : _a, _b = options.silent, silent = _b === void 0 ? false : _b;
                    write = function (msg) { return common_1.util.write(msg, options.silent); };
                    sync = function (sources, target) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var _i, sources_1, source;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _i = 0, sources_1 = sources;
                                    _a.label = 1;
                                case 1:
                                    if (!(_i < sources_1.length)) return [3, 4];
                                    source = sources_1[_i];
                                    if (!source.package) return [3, 3];
                                    return [4, common_1.updatePackageRef(target, source.package.name, source.package.version, { save: true })];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3:
                                    _i++;
                                    return [3, 1];
                                case 4: return [2];
                            }
                        });
                    }); };
                    tasks = modules.map(function (target) {
                        var sources = common_1.filter
                            .localDeps(target)
                            .filter(function (dep) { return common_1.filter.includeIgnored(dep.package, includeIgnored); });
                        var title = common_1.log.magenta(target.name);
                        return {
                            title: title,
                            task: function () { return sync(sources, target); },
                        };
                    });
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 9, , 10]);
                    if (!silent) return [3, 6];
                    _i = 0, tasks_1 = tasks;
                    _c.label = 2;
                case 2:
                    if (!(_i < tasks_1.length)) return [3, 5];
                    item = tasks_1[_i];
                    return [4, item.task()];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3, 2];
                case 5: return [3, 8];
                case 6:
                    taskList = common_1.listr(tasks, { concurrent: false });
                    return [4, taskList.run()];
                case 7:
                    _c.sent();
                    write(common_1.log.gray(" " + common_1.elapsed(startedAt) + ", " + common_1.moment().format('h:mm:ssa')));
                    write('');
                    _c.label = 8;
                case 8: return [3, 10];
                case 9:
                    error_1 = _c.sent();
                    write(common_1.log.yellow("\nFailed while syncing module '" + error_1.message + "'."));
                    return [3, 10];
                case 10: return [2, modules];
            }
        });
    });
}
