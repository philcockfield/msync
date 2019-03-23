"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var constants = require("./constants");
var libs_1 = require("./libs");
var npm = require("./util.npm");
var util_package_1 = require("./util.package");
function loadSettings(options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, spinner, _b, npm, result_1, title, task;
        var _this = this;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = options.spinner, spinner = _a === void 0 ? false : _a, _b = options.npm, npm = _b === void 0 ? false : _b;
                    if (!spinner) return [3, 2];
                    title = npm
                        ? 'Loading module info locally and from NPM.'
                        : 'Loading module info locally.';
                    task = {
                        title: title,
                        task: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, loadSettingsInternal(options)];
                                case 1: return [2, (result_1 = _a.sent())];
                            }
                        }); }); },
                    };
                    return [4, libs_1.listr([task]).run()];
                case 1:
                    _c.sent();
                    libs_1.log.info();
                    return [2, result_1];
                case 2: return [2, loadSettingsInternal(options)];
            }
        });
    });
}
exports.loadSettings = loadSettings;
function loadSettingsInternal(options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var path, yaml, dir, modules, ignore, _a, npmModules_1;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, libs_1.file.findClosestAncestor(process.cwd(), constants.CONFIG_FILE_NAME)];
                case 1:
                    path = _b.sent();
                    if (!path) {
                        return [2];
                    }
                    return [4, loadYaml(path)];
                case 2:
                    yaml = _b.sent();
                    if (!yaml) {
                        return [2];
                    }
                    dir = libs_1.fs.dirname(path);
                    yaml.modules = yaml.modules.map(function (path) { return libs_1.fs.resolve(dir, path); });
                    return [4, util_package_1.toPackages(yaml.modules)];
                case 3:
                    modules = _b.sent();
                    modules = util_package_1.orderByDepth(modules);
                    _a = {};
                    return [4, ignorePaths(yaml, dir)];
                case 4:
                    ignore = (_a.paths = _b.sent(),
                        _a.names = yaml.ignore.names,
                        _a);
                    modules.forEach(function (pkg) { return (pkg.isIgnored = isIgnored(pkg, ignore)); });
                    if (!options.npm) return [3, 6];
                    return [4, npm.info(modules.filter(function (pkg) { return !pkg.isIgnored; }))];
                case 5:
                    npmModules_1 = _b.sent();
                    modules.forEach(function (pkg) {
                        pkg.npm = npmModules_1.find(function (item) { return item.name === pkg.name; });
                        if (pkg.npm && libs_1.semver.gt(pkg.npm.latest, pkg.version)) {
                            pkg.latest = pkg.npm.latest;
                        }
                    });
                    _b.label = 6;
                case 6: return [2, {
                        path: path,
                        ignored: ignore,
                        watchPattern: yaml.watchPattern,
                        modules: modules,
                    }];
            }
        });
    });
}
function ignorePaths(yaml, dir) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var result, _i, _a, pattern, paths;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    result = [];
                    _i = 0, _a = yaml.ignore.paths;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3, 4];
                    pattern = _a[_i];
                    return [4, libs_1.fs.glob.find(libs_1.fs.resolve(dir, pattern))];
                case 2:
                    paths = _b.sent();
                    paths.forEach(function (path) { return result.push(path); });
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3, 1];
                case 4: return [2, result];
            }
        });
    });
}
function isIgnored(pkg, ignore) {
    if (ignore.names.includes(pkg.name)) {
        return true;
    }
    for (var _i = 0, _a = ignore.paths; _i < _a.length; _i++) {
        var path = _a[_i];
        if (pkg.dir.startsWith(path)) {
            return true;
        }
    }
    return false;
}
function loadYaml(path) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var result, error_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, libs_1.file.yaml(path)];
                case 1:
                    result = _a.sent();
                    result.modules = result.modules || [];
                    result.ignore = result.ignore || { paths: [] };
                    result.ignore.paths = result.ignore.paths || [];
                    result.ignore.names = result.ignore.names || [];
                    result.watchPattern = result.watchPattern || constants.DEFAULT_WATCH_PATTERN;
                    return [2, result];
                case 2:
                    error_1 = _a.sent();
                    libs_1.log.error("Failed to parse YAML configuration.");
                    libs_1.log.error(error_1.message);
                    libs_1.log.info(libs_1.log.magenta('File:'), path, '\n');
                    return [3, 3];
                case 3: return [2];
            }
        });
    });
}
