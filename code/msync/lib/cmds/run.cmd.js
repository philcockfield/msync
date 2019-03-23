"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var common_1 = require("../common");
var listCommand = require("./ls.cmd");
exports.name = 'run';
exports.alias = 'r';
exports.description = 'Runs the given command on all modules.';
exports.args = {
    '<command>': 'The shell command to invoke.',
    '-i': 'Include ignored modules.',
    '-c': 'Run command concurrently against all modules.  (Default: false).',
};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var cmd, options, includeIgnored, concurrent;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cmd = (args && args.params && args.params.join(' ')) || '';
                    options = (args && args.options) || {};
                    includeIgnored = options.i || false;
                    concurrent = options.c || false;
                    return [4, run(cmd, { includeIgnored: includeIgnored, concurrent: concurrent })];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.cmd = cmd;
function run(cmd, options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, includeIgnored, _b, concurrent, settings, modules, tasks, runner, error_1;
        var _this = this;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = options.includeIgnored, includeIgnored = _a === void 0 ? false : _a, _b = options.concurrent, concurrent = _b === void 0 ? false : _b;
                    if (!cmd) {
                        common_1.log.info.red("No command specified.\n");
                        return [2];
                    }
                    return [4, common_1.loadSettings()];
                case 1:
                    settings = _c.sent();
                    if (!settings) {
                        common_1.log.warn.yellow(common_1.constants.CONFIG_NOT_FOUND_ERROR);
                        return [2];
                    }
                    modules = options.modules || settings.modules.filter(function (pkg) { return common_1.filter.includeIgnored(pkg, includeIgnored); });
                    if (common_1.value.defaultValue(options.printStatus, true)) {
                        common_1.log.info.magenta("\nRun " + common_1.log.cyan(cmd) + " on:");
                        listCommand.printTable(modules, { showPath: true });
                        common_1.log.info();
                    }
                    tasks = modules.map(function (pkg) {
                        return {
                            title: common_1.log.cyan(pkg.name) + " " + common_1.log.magenta(cmd),
                            task: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var command;
                                return tslib_1.__generator(this, function (_a) {
                                    command = "cd " + pkg.dir + " && " + cmd;
                                    return [2, common_1.exec.cmd.run(command, { silent: true })];
                                });
                            }); },
                        };
                    });
                    runner = common_1.listr(tasks, { concurrent: concurrent, exitOnError: false });
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    return [4, runner.run()];
                case 3:
                    _c.sent();
                    return [3, 5];
                case 4:
                    error_1 = _c.sent();
                    return [3, 5];
                case 5:
                    common_1.log.info();
                    return [2];
            }
        });
    });
}
exports.run = run;
