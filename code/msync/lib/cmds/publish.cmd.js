"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var common_1 = require("../common");
var ls_cmd_1 = require("./ls.cmd");
exports.name = 'publish';
exports.alias = ['p', 'pub'];
exports.description = 'Publishes all modules that are ahead of NPM.';
exports.args = {};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, publish({})];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.cmd = cmd;
function publish(options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var settings, modules, total, startedAt, publishCommand, publishResult;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, common_1.loadSettings({ npm: true, spinner: true })];
                case 1:
                    settings = _a.sent();
                    if (!settings) {
                        common_1.log.warn.yellow(common_1.constants.CONFIG_NOT_FOUND_ERROR);
                        return [2];
                    }
                    modules = settings.modules.filter(function (pkg) { return isPublishRequired(pkg); });
                    ls_cmd_1.printTable(modules);
                    total = modules.length;
                    if (total === 0) {
                        common_1.log.info.gray("\u2728\u2728  No modules need to be published.\n");
                        return [2];
                    }
                    return [4, promptYesNo("Publish " + total + " " + common_1.plural('module', total) + " to NPM now?")];
                case 2:
                    if (!(_a.sent())) {
                        common_1.log.info();
                        return [2];
                    }
                    common_1.log.info.gray("Publishing to NPM:\n");
                    startedAt = new Date();
                    publishCommand = function (pkg) {
                        var install = pkg.engine === 'YARN' ? 'yarn install' : 'npm install';
                        return install + " && npm publish && msync sync";
                    };
                    return [4, runCommand(modules, publishCommand, {
                            concurrent: false,
                            exitOnError: true,
                        })];
                case 3:
                    publishResult = _a.sent();
                    if (publishResult.success) {
                        common_1.log.info("\n\u2728\u2728  Done " + common_1.log.gray(common_1.elapsed(startedAt)) + "\n");
                    }
                    else {
                        common_1.log.info.yellow("\n\uD83D\uDCA9  Something went wrong while publishing.\n");
                        common_1.log.error(publishResult.error);
                    }
                    return [2];
            }
        });
    });
}
exports.publish = publish;
var runCommand = function (modules, cmd, options) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var errors, task, tasks, runner, error_1;
    var _this = this;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                errors = [];
                task = function (pkg) {
                    return {
                        title: common_1.log.cyan(pkg.name) + " " + common_1.log.magenta(cmd(pkg)),
                        task: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var command, res;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        command = "cd " + pkg.dir + " && " + cmd(pkg);
                                        return [4, common_1.exec.cmd.run(command, { silent: true })];
                                    case 1:
                                        res = _a.sent();
                                        if (res.error) {
                                            errors = errors.concat([{ pkg: pkg, info: res.info, errors: res.errors }]);
                                            throw res.error;
                                        }
                                        return [2, res];
                                }
                            });
                        }); },
                    };
                };
                tasks = modules.map(function (pkg) { return task(pkg); });
                runner = common_1.listr(tasks, options);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4, runner.run()];
            case 2:
                _a.sent();
                return [2, { success: true, error: null }];
            case 3:
                error_1 = _a.sent();
                errors.forEach(function (_a) {
                    var info = _a.info;
                    info.forEach(function (line) { return common_1.log.info(line); });
                });
                return [2, { success: false, error: error_1 }];
            case 4: return [2];
        }
    });
}); };
function promptYesNo(message) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var confirm, res, answer;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    confirm = {
                        type: 'list',
                        name: 'answer',
                        message: message,
                        choices: [{ name: 'Yes', value: 'true' }, { name: 'No', value: 'false' }],
                    };
                    return [4, common_1.inquirer.prompt(confirm)];
                case 1:
                    res = (_a.sent());
                    answer = res.answer;
                    return [2, answer === 'true' ? true : false];
            }
        });
    });
}
var isPublishRequired = function (pkg) {
    return pkg.npm ? common_1.semver.gt(pkg.version, pkg.npm.latest) : false;
};
