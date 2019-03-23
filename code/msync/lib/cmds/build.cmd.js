"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var common_1 = require("../common");
var listCommand = require("./ls.cmd");
var syncCommand = require("./sync.cmd");
exports.name = 'build';
exports.description = 'Builds and syncs all typescript modules in order.';
exports.args = {
    '-i': 'Include ignored modules.',
    '-w': 'Sync on changes to files.',
    '-v': 'Verbose mode. Prints all error details.',
};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var options, watch, includeIgnored, verbose;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = (args && args.options) || {};
                    watch = options.w || false;
                    includeIgnored = options.i || false;
                    verbose = options.v || false;
                    return [4, build({ includeIgnored: includeIgnored, watch: watch, verbose: verbose })];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.cmd = cmd;
function build(options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, includeIgnored, _b, watch, _c, verbose, settings, modules;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = options.includeIgnored, includeIgnored = _a === void 0 ? false : _a, _b = options.watch, watch = _b === void 0 ? false : _b, _c = options.verbose, verbose = _c === void 0 ? false : _c;
                    return [4, common_1.loadSettings()];
                case 1:
                    settings = _d.sent();
                    if (!settings) {
                        common_1.log.warn.yellow(common_1.constants.CONFIG_NOT_FOUND_ERROR);
                        return [2];
                    }
                    modules = settings.modules
                        .filter(function (pkg) { return common_1.filter.includeIgnored(pkg, includeIgnored); })
                        .filter(function (pkg) { return pkg.isTypeScript; });
                    if (watch) {
                        return [2, buildWatch(modules, includeIgnored, verbose)];
                    }
                    else {
                        return [2, buildOnce(modules)];
                    }
                    return [2];
            }
        });
    });
}
exports.build = build;
var tscCommand = function (pkg) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
    var path;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                path = common_1.fs.join(pkg.dir, 'node_modules/typescript/bin/tsc');
                return [4, common_1.fs.pathExists(path)];
            case 1: return [2, (_a.sent()) ? path : 'tsc'];
        }
    });
}); };
function buildOnce(modules) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var startedAt, tasks, taskList, error_1;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startedAt = new Date();
                    tasks = modules.map(function (pkg) {
                        return {
                            title: common_1.log.magenta(pkg.name) + " " + common_1.log.gray('=> sync'),
                            task: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var tsc, cmd;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4, tscCommand(pkg)];
                                        case 1:
                                            tsc = _a.sent();
                                            cmd = "cd " + pkg.dir + " && " + tsc;
                                            return [4, common_1.exec.cmd.run(cmd, { silent: true })];
                                        case 2:
                                            _a.sent();
                                            return [4, syncCommand.sync({
                                                    includeIgnored: false,
                                                    updateVersions: false,
                                                    silent: true,
                                                })];
                                        case 3:
                                            _a.sent();
                                            return [2];
                                    }
                                });
                            }); },
                        };
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    taskList = common_1.listr(tasks, { concurrent: false, exitOnError: false });
                    return [4, taskList.run()];
                case 2:
                    _a.sent();
                    common_1.log.info.gray('', common_1.elapsed(startedAt));
                    common_1.log.info();
                    return [3, 4];
                case 3:
                    error_1 = _a.sent();
                    return [3, 4];
                case 4: return [2];
            }
        });
    });
}
exports.buildOnce = buildOnce;
function buildWatch(modules, includeIgnored, verbose) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var state, updates$;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            common_1.log.info.magenta('\nBuild watching:');
            listCommand.printTable(modules, { includeIgnored: includeIgnored });
            common_1.log.info();
            state = {};
            updates$ = new rxjs_1.Subject();
            updates$.pipe(operators_1.debounceTime(100)).subscribe(function () {
                common_1.log.clear();
                var items = Object.keys(state)
                    .sort()
                    .map(function (key) { return ({ key: key, value: state[key] }); });
                items.forEach(function (_a) {
                    var key = _a.key, value = _a.value;
                    var hasErrors = value.errors.length > 0;
                    var bullet = hasErrors ? common_1.log.red('✘') : value.isBuilding ? common_1.log.gray('✎') : common_1.log.green('✔');
                    common_1.log.info(bullet + " " + common_1.log.cyan(key) + " " + value.message);
                });
                var errors = items.filter(function (_a) {
                    var value = _a.value;
                    return value.errors.length > 0;
                });
                if (verbose && errors.length > 0) {
                    common_1.log.info();
                    errors.forEach(function (_a) {
                        var key = _a.key, value = _a.value;
                        value.errors.forEach(function (error) {
                            common_1.log
                                .table()
                                .add([common_1.log.yellow(key), formatError(error)])
                                .log();
                        });
                    });
                }
            });
            modules.forEach(function (pkg) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var tsc, cmd;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4, tscCommand(pkg)];
                        case 1:
                            tsc = _a.sent();
                            cmd = "cd " + pkg.dir + " && " + tsc + " --watch";
                            common_1.exec.cmd.run(cmd).output$.subscribe(function (e) {
                                var text = e.text;
                                var isBuilding = text.includes('Starting compilation in watch') ||
                                    text.includes('Starting incremental compilation');
                                var isError = text.includes('error') && !text.includes('Found 0 errors.');
                                var isSuccess = text.includes('Found 0 errors.');
                                var isBuilt = text.includes('Watching for file changes.');
                                text = text.replace(/\n*$/, '');
                                var key = pkg.name;
                                var obj = state[key] || { count: 0, errors: [] };
                                obj.isBuilding = isBuilding;
                                if (isBuilding || isBuilt) {
                                    var count = isBuilding ? obj.count + 1 : obj.count;
                                    var status_1 = isBuilding ? 'Building...' : 'Built';
                                    var countStatus = isBuilding ? common_1.log.gray(count) : common_1.log.green(count);
                                    var message = common_1.log.gray(status_1 + " (" + countStatus + ")");
                                    obj = tslib_1.__assign({}, obj, { count: count, message: message });
                                }
                                if (isError) {
                                    if (!isBuilt) {
                                        obj.errors = obj.errors.concat([text]);
                                    }
                                    var error = obj.errors.length === 1 ? 'Error' : 'Errors';
                                    obj.message = common_1.log.red(obj.errors.length + " " + error);
                                }
                                if (isSuccess) {
                                    obj.errors = [];
                                }
                                state[key] = obj;
                                updates$.next();
                            });
                            return [2];
                    }
                });
            }); });
            return [2];
        });
    });
}
exports.buildWatch = buildWatch;
var formatError = function (error) {
    var MAX = 80;
    var lines = [];
    error.split('\n').forEach(function (line) {
        line = line.length <= MAX ? line : splitLines(line);
        lines.push(line);
    });
    return lines.join('\n');
};
var splitLines = function (line) {
    var MAX = 80;
    var words = [];
    var count = 0;
    line.split('').forEach(function (word) {
        count += word.length;
        if (count > MAX) {
            word = word + "\n";
            count = 0;
        }
        words.push(word);
    });
    return words.join('');
};
