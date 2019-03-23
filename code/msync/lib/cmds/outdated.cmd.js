"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var common_1 = require("../common");
var run_cmd_1 = require("./run.cmd");
exports.name = 'outdated';
exports.alias = 'o';
exports.description = 'Checks all modules for outdated references on NPM.';
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            outdated({});
            return [2];
        });
    });
}
exports.cmd = cmd;
function outdated(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, includeIgnored, settings, modules, results, tasks, runner, error_1, updated, _b, _c;
        var _this = this;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = options.includeIgnored, includeIgnored = _a === void 0 ? false : _a;
                    return [4, common_1.loadSettings()];
                case 1:
                    settings = _d.sent();
                    if (!settings) {
                        common_1.log.warn.yellow(common_1.constants.CONFIG_NOT_FOUND_ERROR);
                        return [2];
                    }
                    modules = settings.modules.filter(function (pkg) { return common_1.filter.includeIgnored(pkg, includeIgnored); });
                    common_1.log.info.magenta("\nChecking for outdated modules:");
                    results = [];
                    tasks = modules.map(function (pkg) {
                        return {
                            title: "" + common_1.log.cyan(pkg.name),
                            task: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var result;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4, getOutdated(pkg)];
                                        case 1:
                                            result = _a.sent();
                                            if (result.modules.length > 0 || result.error) {
                                                results.push(result);
                                            }
                                            return [2];
                                    }
                                });
                            }); },
                        };
                    });
                    runner = common_1.listr(tasks, { concurrent: true, exitOnError: false });
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 4, , 5]);
                    return [4, runner.run()];
                case 3:
                    _d.sent();
                    return [3, 5];
                case 4:
                    error_1 = _d.sent();
                    return [3, 5];
                case 5:
                    if (!(results.length > 0)) return [3, 10];
                    common_1.log.info();
                    results.forEach(function (item) { return printOutdatedModule(item); });
                    _b = updatePackageJsonRefs;
                    _c = [modules];
                    return [4, promptToUpdate(results)];
                case 6: return [4, _b.apply(void 0, _c.concat([_d.sent()]))];
                case 7:
                    updated = _d.sent();
                    if (!(updated.length > 0)) return [3, 9];
                    return [4, run_cmd_1.run('yarn install', { concurrent: true, modules: updated, printStatus: false })];
                case 8:
                    _d.sent();
                    _d.label = 9;
                case 9: return [3, 11];
                case 10:
                    common_1.log.info();
                    common_1.log.info.gray("All modules up-to-date.");
                    _d.label = 11;
                case 11:
                    common_1.log.info();
                    return [2];
            }
        });
    });
}
exports.outdated = outdated;
function promptToUpdate(outdated) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var updates, choices, answer;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (outdated.length === 0) {
                        return [2, []];
                    }
                    updates = {};
                    outdated.forEach(function (outdated) {
                        outdated.modules.forEach(function (m) {
                            var name = m.name, latest = m.latest;
                            var current = updates[name] ? updates[name].latest : undefined;
                            if (!current || common_1.semver.gt(latest, current)) {
                                updates[name] = { name: name, latest: latest };
                            }
                        });
                    });
                    choices = Object.keys(updates).map(function (key) {
                        var update = updates[key];
                        var name = key + " \u279C " + update.latest;
                        return { name: name, value: update.name };
                    });
                    if (choices.length === 0) {
                        return [2, []];
                    }
                    return [4, common_1.inquirer.prompt({
                            name: 'update',
                            type: 'checkbox',
                            choices: choices,
                        })];
                case 1:
                    answer = _a.sent();
                    return [2, Object.keys(updates)
                            .map(function (key) { return updates[key]; })
                            .filter(function (update) { return answer.update.includes(update.name); })];
            }
        });
    });
}
function updatePackageJsonRefs(modules, updates) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var updated, _loop_1, _i, updates_1, update;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (updates.length === 0) {
                        return [2, []];
                    }
                    updated = [];
                    _loop_1 = function (update) {
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, Promise.all(modules.map(function (pkg) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                        var changed;
                                        return tslib_1.__generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4, common_1.updatePackageRef(pkg, update.name, update.latest, { save: true })];
                                                case 1:
                                                    changed = _a.sent();
                                                    if (changed && !updated.some(function (m) { return m.name === pkg.name; })) {
                                                        updated = updated.concat([pkg]);
                                                    }
                                                    return [2];
                                            }
                                        });
                                    }); }))];
                                case 1:
                                    _a.sent();
                                    return [2];
                            }
                        });
                    };
                    _i = 0, updates_1 = updates;
                    _a.label = 1;
                case 1:
                    if (!(_i < updates_1.length)) return [3, 4];
                    update = updates_1[_i];
                    return [5, _loop_1(update)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3, 1];
                case 4:
                    if (updated.length > 0) {
                        common_1.log.info.gray("\nUpdated:");
                        updated.forEach(function (pkg) {
                            common_1.log.info.gray(" - " + common_1.log.cyan(pkg.name));
                        });
                        common_1.log.info();
                    }
                    return [2, updated];
            }
        });
    });
}
function getOutdated(pkg) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var result, cmd, res, _a, outdated_1, error, error_2;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    result = { name: pkg.name, modules: [] };
                    cmd = "cd " + pkg.dir + " && npm outdated --json";
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4, common_1.exec.cmd.run(cmd, { silent: true })];
                case 2:
                    res = _b.sent();
                    _a = parseOutdated(res.info), outdated_1 = _a.outdated, error = _a.error;
                    result.modules = outdated_1;
                    result.error = error;
                    return [3, 4];
                case 3:
                    error_2 = _b.sent();
                    result.error = error_2.message;
                    return [3, 4];
                case 4: return [2, result];
            }
        });
    });
}
function parseOutdated(stdout) {
    if (!stdout || stdout.length === 0) {
        return { outdated: [] };
    }
    var json = JSON.parse(stdout.join('\n'));
    var error = json.error;
    if (error) {
        return { error: error.summary, outdated: [] };
    }
    var outdated = Object.keys(json).map(function (name) {
        var _a = json[name], current = _a.current, wanted = _a.wanted, latest = _a.latest, location = _a.location;
        var outdated = { name: name, current: current, wanted: wanted, latest: latest, location: location };
        return outdated;
    });
    return { outdated: outdated };
}
function printOutdatedModule(outdated) {
    common_1.log.info.yellow("" + outdated.name);
    if (outdated.error) {
        common_1.log.info.red(outdated.error);
    }
    var table = common_1.log.table({
        head: ['Package', 'Current', 'Wanted', 'Latest'].map(function (label) { return common_1.log.gray(label); }),
    });
    outdated.modules.forEach(function (item) {
        var name = item.name, current = item.current, wanted = item.wanted, latest = item.latest;
        table.add([
            name,
            common_1.log.gray(current),
            wanted === latest ? common_1.log.green(wanted) : common_1.log.magenta(wanted),
            common_1.log.green(latest),
        ]);
    });
    if (outdated.modules.length > 0) {
        table.log();
    }
    common_1.log.info();
}
