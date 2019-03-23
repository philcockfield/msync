"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var path_1 = require("path");
var common_1 = require("../common");
exports.name = 'tsconfig';
exports.alias = 'ts';
exports.description = "Common transformations across typescript configuration files.";
exports.args = {
    '-i': 'Include ignored modules.',
};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var options, includeIgnored, settings, response, paths, parts, _a;
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
                                message: 'Change?',
                                choices: ['noUnusedLocals: true', 'noUnusedLocals: false'],
                            },
                        ])];
                case 2:
                    response = (_b.sent());
                    common_1.log.info();
                    return [4, getTsconfigPaths(settings, { includeIgnored: includeIgnored })];
                case 3:
                    paths = _b.sent();
                    parts = toChoiceParts(response.type);
                    _a = response.type;
                    switch (_a) {
                        case 'noUnusedLocals: true': return [3, 4];
                        case 'noUnusedLocals: false': return [3, 4];
                    }
                    return [3, 6];
                case 4: return [4, saveChangesWithPrompt(paths, { noUnusedLocals: parts.value })];
                case 5:
                    _b.sent();
                    return [3, 7];
                case 6:
                    common_1.log.error("'" + response.type + "' not supported.");
                    return [3, 7];
                case 7:
                    common_1.log.info();
                    return [2];
            }
        });
    });
}
exports.cmd = cmd;
function getTsconfigPaths(settings, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, includeIgnored, paths;
        return tslib_1.__generator(this, function (_b) {
            _a = options.includeIgnored, includeIgnored = _a === void 0 ? false : _a;
            paths = settings.modules
                .filter(function (pkg) { return common_1.filter.includeIgnored(pkg, includeIgnored); })
                .map(function (m) { return m.dir; })
                .map(function (dir) { return common_1.fs.join(dir, 'tsconfig.json'); });
            return [2, common_1.filter.fileExists(paths)];
        });
    });
}
function saveChangesWithPrompt(paths, changes) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var response, _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (paths.length === 0) {
                        common_1.log.info.gray('No files to change.');
                        return [2, false];
                    }
                    common_1.log.info.cyan("\nChange files:");
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
                case 1:
                    response = (_b.sent());
                    _a = response.confirm;
                    switch (_a) {
                        case 'No': return [3, 2];
                        case 'Yes': return [3, 3];
                    }
                    return [3, 5];
                case 2:
                    common_1.log.info.gray("Nothing changed.");
                    return [2, false];
                case 3: return [4, saveChanges(paths, changes)];
                case 4:
                    _b.sent();
                    return [2, true];
                case 5: return [2, false];
            }
        });
    });
}
function toDisplayPath(path) {
    var root = path_1.parse(path);
    var dir = path_1.parse(root.dir);
    return common_1.log.gray(dir.dir + "/" + common_1.log.magenta(dir.base) + "/" + common_1.log.cyan(root.base));
}
function saveChanges(paths, changes) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var saveChange, tasks, error_1;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    saveChange = function (path) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var json, compilerOptions, tsConfig, text;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, common_1.fs.readJson(path)];
                                case 1:
                                    json = _a.sent();
                                    compilerOptions = tslib_1.__assign({}, json.compilerOptions, changes);
                                    tsConfig = tslib_1.__assign({}, json, { compilerOptions: compilerOptions });
                                    text = JSON.stringify(tsConfig, null, '  ') + "\n";
                                    return [4, common_1.fs.writeFile(path, text)];
                                case 2:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    }); };
                    tasks = paths.map(function (path) {
                        return {
                            title: common_1.log.cyan('Updated') + " " + toDisplayPath(path),
                            task: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
                                return [2, saveChange(path)];
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
function toChoiceParts(choice) {
    var parts = choice.split(':');
    var key = parts[0].trim();
    var value = common_1.value.toType(parts[1].trim());
    return { key: key, value: value };
}
