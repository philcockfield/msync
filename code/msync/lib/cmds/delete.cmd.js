"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var path_1 = require("path");
var common_1 = require("../common");
exports.name = 'delete';
exports.alias = 'del';
exports.description = "Deletes transient files across projects (such as logs, yarn.lock, node_modules etc).";
exports.args = {
    '-i': 'Include ignored modules.',
};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var options, includeIgnored, settings, response, modules, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    options = (args && args.options) || {};
                    includeIgnored = options.i || false;
                    return [4, common_1.loadSettings()];
                case 1:
                    settings = _b.sent();
                    if (!settings) {
                        common_1.log.warn.yellow(common_1.constants.CONFIG_NOT_FOUND_ERROR);
                        return [2];
                    }
                    return [4, common_1.inquirer.prompt([
                            {
                                type: 'list',
                                name: 'type',
                                message: 'Delete?',
                                choices: ['logs', 'yarn.lock', 'package-lock.json', 'node_modules'],
                            },
                        ])];
                case 2:
                    response = (_b.sent());
                    common_1.log.info();
                    modules = settings.modules
                        .filter(function (pkg) { return common_1.filter.includeIgnored(pkg, includeIgnored); })
                        .map(function (m) { return m.dir; });
                    _a = response.type;
                    switch (_a) {
                        case 'yarn.lock': return [3, 3];
                        case 'package-lock.json': return [3, 5];
                        case 'logs': return [3, 7];
                        case 'node_modules': return [3, 9];
                    }
                    return [3, 11];
                case 3: return [4, deleteAfterPrompt(modules.map(function (dir) { return dir + "/yarn.lock"; }))];
                case 4:
                    _b.sent();
                    return [3, 12];
                case 5: return [4, deleteAfterPrompt(modules.map(function (dir) { return dir + "/package-lock.json"; }))];
                case 6:
                    _b.sent();
                    return [3, 12];
                case 7: return [4, deleteAfterPrompt(common_1.flatten([
                        modules.map(function (dir) { return dir + "/yarn-error.log"; }),
                        modules.map(function (dir) { return dir + "/npm-debug.log"; }),
                    ]))];
                case 8:
                    _b.sent();
                    return [3, 12];
                case 9: return [4, deleteAfterPrompt(modules.map(function (dir) { return dir + "/node_modules"; }))];
                case 10:
                    _b.sent();
                    return [3, 12];
                case 11:
                    common_1.log.error("'" + response.type + "' not supported.");
                    return [3, 12];
                case 12:
                    common_1.log.info();
                    return [2];
            }
        });
    });
}
exports.cmd = cmd;
function deleteAfterPrompt(paths) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var response, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4, common_1.filter.fileExists(paths)];
                case 1:
                    paths = _b.sent();
                    if (paths.length === 0) {
                        common_1.log.info.gray('No files to delete.');
                        return [2, false];
                    }
                    common_1.log.info.cyan("\nDelete files:");
                    paths.forEach(function (path) {
                        common_1.log.info(" " + toDisplayPath(path));
                    });
                    common_1.log.info();
                    return [4, common_1.inquirer.prompt([
                            {
                                type: 'list',
                                name: 'confirm',
                                message: 'Are you sure?',
                                choices: ['No', 'Yes'],
                            },
                        ])];
                case 2:
                    response = (_b.sent());
                    _a = response.confirm;
                    switch (_a) {
                        case 'No': return [3, 3];
                        case 'Yes': return [3, 4];
                    }
                    return [3, 6];
                case 3:
                    common_1.log.info.gray("Nothing deleted.");
                    return [2, false];
                case 4:
                    common_1.log.info();
                    return [4, deleteFiles(paths)];
                case 5:
                    _b.sent();
                    return [2, true];
                case 6: return [2, false];
            }
        });
    });
}
function toDisplayPath(path) {
    var root = path_1.parse(path);
    var dir = path_1.parse(root.dir);
    return common_1.log.gray(dir.dir + "/" + common_1.log.magenta(dir.base) + "/" + common_1.log.cyan(root.base));
}
function deleteFiles(paths) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var tasks, error_1;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tasks = paths.map(function (path) {
                        return {
                            title: common_1.log.cyan('Delete') + " " + toDisplayPath(path),
                            task: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
                                return [2, common_1.tryDelete(path, { retry: 3 })];
                            }); }); },
                        };
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, common_1.listr(tasks, { concurrent: true, exitOnError: false }).run()];
                case 2:
                    _a.sent();
                    return [3, 4];
                case 3:
                    error_1 = _a.sent();
                    return [3, 4];
                case 4: return [2];
            }
        });
    });
}
