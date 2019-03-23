"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var common_1 = require("../common");
exports.name = 'audit';
exports.alias = ['a'];
exports.description = 'Runs an NPM security audit across all modules.';
exports.args = {};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, audit({})];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.cmd = cmd;
function audit(options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var settings, startedAt, res, totalIssues, msg;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, common_1.loadSettings({ npm: true, spinner: true })];
                case 1:
                    settings = _a.sent();
                    if (!settings) {
                        common_1.log.warn.yellow(common_1.constants.CONFIG_NOT_FOUND_ERROR);
                        return [2];
                    }
                    common_1.log.info.gray("Auditing modules:\n");
                    startedAt = new Date();
                    return [4, runAudits(settings.modules, {
                            concurrent: true,
                            exitOnError: false,
                        })];
                case 2:
                    res = _a.sent();
                    totalIssues = res.data.reduce(function (acc, next) { return acc + next.issues; }, 0);
                    if (totalIssues > 0) {
                        printAudit(res.data);
                    }
                    if (res.success) {
                        msg = totalIssues === 0 ? common_1.log.green("All modules are safe.") : 'Done';
                        common_1.log.info("\n\u2728\u2728  " + msg + " " + common_1.log.gray(common_1.elapsed(startedAt)) + "\n");
                    }
                    else {
                        common_1.log.info.yellow("\n\uD83D\uDCA9  Something went wrong while running the audit.\n");
                    }
                    return [2];
            }
        });
    });
}
exports.audit = audit;
function levelColor(level) {
    switch (level) {
        case 'info':
            return common_1.log.white;
        case 'low':
        case 'moderate':
            return common_1.log.yellow;
        case 'high':
        case 'critical':
            return common_1.log.red;
    }
}
function printAudit(results) {
    var head = [common_1.log.gray('module'), common_1.log.red('vulnerabilities')];
    var builder = common_1.log.table({ head: head });
    results
        .filter(function (audit) { return !audit.ok; })
        .forEach(function (audit) {
        var bullet = audit.ok ? common_1.log.green('✔') : common_1.log.red('✖');
        var output = Object.keys(audit.vulnerabilities)
            .map(function (key) { return ({ key: key, value: audit.vulnerabilities[key] }); })
            .reduce(function (acc, next) {
            var text = next.value > 0 ? common_1.log.gray(next.key + ": " + levelColor(next.key)(next.value)) : '';
            return text ? acc + " " + text : acc;
        }, '')
            .trim();
        builder.add([
            common_1.log.gray(bullet + " " + common_1.log.cyan(audit.module) + " " + audit.version),
            output || common_1.log.green('safe'),
        ]);
    });
    common_1.log.info();
    builder.log();
}
function runAudits(modules, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var data, task, tasks, runner, error_1;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = [];
                    task = function (pkg) {
                        return {
                            title: common_1.log.cyan(pkg.name) + " " + common_1.log.gray('npm audit'),
                            task: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var npmLockFile, hasNpmLock, cmd, commands, json, vulnerabilities, issues, result;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            npmLockFile = common_1.fs.join(pkg.dir, 'package-lock.json');
                                            return [4, common_1.fs.pathExists(npmLockFile)];
                                        case 1:
                                            hasNpmLock = _a.sent();
                                            cmd = function (text) { return "cd " + pkg.dir + " && " + text; };
                                            commands = {
                                                install: cmd("npm install"),
                                                audit: cmd("npm audit --json"),
                                            };
                                            return [4, common_1.exec.cmd.run(commands.install, { silent: true })];
                                        case 2:
                                            _a.sent();
                                            return [4, execToJson(commands.audit)];
                                        case 3:
                                            json = _a.sent();
                                            if (json && json.error) {
                                                throw new Error(json.error.summary);
                                            }
                                            vulnerabilities = json
                                                ? json.metadata.vulnerabilities
                                                : [];
                                            issues = Object.keys(vulnerabilities)
                                                .map(function (key) { return ({ key: key, value: vulnerabilities[key] }); })
                                                .reduce(function (acc, next) { return (next.value > 0 ? acc + next.value : acc); }, 0);
                                            if (!!hasNpmLock) return [3, 5];
                                            return [4, common_1.fs.remove(npmLockFile)];
                                        case 4:
                                            _a.sent();
                                            _a.label = 5;
                                        case 5:
                                            result = {
                                                module: pkg.name,
                                                version: pkg.version,
                                                ok: issues === 0,
                                                issues: issues,
                                                vulnerabilities: vulnerabilities,
                                            };
                                            data = data.concat([result]);
                                            return [2, result];
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
                    return [2, { success: true, data: data, error: null }];
                case 3:
                    error_1 = _a.sent();
                    return [2, { success: false, data: data, error: error_1 }];
                case 4: return [2];
            }
        });
    });
}
function execToJson(cmd) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var done, res, error_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    done = function (stdout, error) {
                        try {
                            return JSON.parse(stdout);
                        }
                        catch (error) {
                            throw error;
                        }
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4, common_1.exec.cmd.run(cmd, { silent: true })];
                case 2:
                    res = _a.sent();
                    return [2, done(res.info.join('\n'))];
                case 3:
                    error_2 = _a.sent();
                    return [2, done(error_2.stdout)];
                case 4: return [2];
            }
        });
    });
}
