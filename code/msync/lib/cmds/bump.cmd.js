"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var common_1 = require("../common");
var listCommand = require("./ls.cmd");
exports.name = 'bump';
exports.alias = 'b';
exports.description = "Bumps a module version along with it's entire dependency graph.";
exports.args = {
    '-i': 'Include ignored modules.',
    '-d': 'Dry run where no files are saved.',
    '-l': 'Local versions only. Does not retrieve NPM details.',
};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var options;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = (args && args.options) || {};
                    return [4, bump({
                            includeIgnored: options.i || false,
                            local: options.l || false,
                            dryRun: options.d || false,
                        })];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.cmd = cmd;
function bump(options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, includeIgnored, _b, local, _c, dryRun, save, npm, settings, modules, module, dependants, release, tableBuilder;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = options.includeIgnored, includeIgnored = _a === void 0 ? false : _a, _b = options.local, local = _b === void 0 ? false : _b, _c = options.dryRun, dryRun = _c === void 0 ? false : _c;
                    save = !dryRun;
                    npm = !local;
                    return [4, common_1.loadSettings({ npm: npm, spinner: npm })];
                case 1:
                    settings = _d.sent();
                    if (!settings) {
                        common_1.log.warn.yellow(common_1.constants.CONFIG_NOT_FOUND_ERROR);
                        return [2];
                    }
                    modules = settings.modules.filter(function (pkg) { return common_1.filter.includeIgnored(pkg, includeIgnored); });
                    return [4, promptForModule(modules)];
                case 2:
                    module = _d.sent();
                    if (!module) {
                        return [2];
                    }
                    dependants = common_1.dependsOn(module, modules);
                    listCommand.printTable([module], { includeIgnored: true, dependants: dependants });
                    if (dryRun) {
                        common_1.log.info.gray("Dry run...no files will be saved.\n");
                    }
                    return [4, promptForReleaseType(module.version)];
                case 3:
                    release = (_d.sent());
                    if (!release) {
                        return [2];
                    }
                    common_1.log.info();
                    return [4, bumpModule({
                            release: release,
                            pkg: module,
                            allModules: modules,
                            save: save,
                        })];
                case 4:
                    tableBuilder = _d.sent();
                    tableBuilder.log();
                    if (dryRun) {
                        common_1.log.info.gray("\nNo files were saved.");
                    }
                    else {
                        common_1.log.info();
                    }
                    return [2];
            }
        });
    });
}
exports.bump = bump;
function bumpModule(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var release, pkg, allModules, save, _a, level, ref, dependants, version, isRoot, head, tableBuilder, msg, json, _i, dependants_1, dependentPkg;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    release = options.release, pkg = options.pkg, allModules = options.allModules, save = options.save, _a = options.level, level = _a === void 0 ? 0 : _a, ref = options.ref;
                    dependants = common_1.dependsOn(pkg, allModules);
                    version = common_1.semver.inc(pkg.latest, release);
                    isRoot = ref === undefined;
                    if (!version) {
                        throw new Error("Failed to '" + release + "' the semver " + pkg.latest + ".");
                    }
                    head = ['update', 'module', 'version', 'ref updated'].map(function (title) { return common_1.log.gray(title); });
                    tableBuilder = options.table || common_1.log.table({ head: head });
                    if (!ref) {
                        msg = '';
                        msg += "  " + common_1.log.yellow(release.toUpperCase()) + " ";
                        msg += "update " + common_1.log.cyan(pkg.name) + " from " + common_1.log.gray(pkg.latest) + " " + common_1.log.gray('=>') + " " + common_1.log.magenta(version) + " ";
                        common_1.log.info.gray(msg);
                    }
                    else {
                        tableBuilder.add([
                            common_1.log.yellow(release.toUpperCase()),
                            common_1.log.cyan(pkg.name),
                            common_1.log.gray(pkg.latest + " => " + common_1.log.magenta(version)),
                            common_1.log.gray(common_1.log.cyan(ref.name) + " " + ref.fromVersion + " => " + common_1.log.magenta(ref.toVersion)),
                        ]);
                    }
                    json = common_1.R.clone(pkg.json);
                    json.version = version;
                    if (!save) return [3, 2];
                    return [4, common_1.savePackage(pkg.dir, json)];
                case 1:
                    _b.sent();
                    _b.label = 2;
                case 2:
                    if (isRoot && dependants.length > 0) {
                        common_1.log.info.gray('\nDependant modules:');
                    }
                    _i = 0, dependants_1 = dependants;
                    _b.label = 3;
                case 3:
                    if (!(_i < dependants_1.length)) return [3, 7];
                    dependentPkg = dependants_1[_i];
                    return [4, common_1.updatePackageRef(dependentPkg, pkg.name, version, { save: save })];
                case 4:
                    _b.sent();
                    return [4, bumpModule({
                            release: 'patch',
                            pkg: dependentPkg,
                            allModules: allModules,
                            level: level + 1,
                            ref: { name: pkg.name, fromVersion: pkg.latest, toVersion: version },
                            save: save,
                            table: tableBuilder,
                        })];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3, 3];
                case 7: return [2, tableBuilder];
            }
        });
    });
}
function promptForModule(modules) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var choices, confirm, res, name;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    choices = modules.map(function (pkg) { return ({ name: pkg.name, value: pkg.name }); });
                    confirm = {
                        type: 'list',
                        name: 'name',
                        message: 'Select a module',
                        choices: choices,
                    };
                    return [4, common_1.inquirer.prompt(confirm)];
                case 1:
                    res = (_a.sent());
                    name = res.name;
                    return [2, modules.find(function (pkg) { return pkg.name === name; })];
            }
        });
    });
}
function promptForReleaseType(version) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var choices, confirm, res;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    choices = ['patch', 'minor', 'major'];
                    confirm = {
                        type: 'list',
                        name: 'name',
                        message: 'Release',
                        choices: choices,
                    };
                    return [4, common_1.inquirer.prompt(confirm)];
                case 1:
                    res = (_a.sent());
                    return [2, res.name];
            }
        });
    });
}
