"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var toposort = require("toposort");
var libs_1 = require("./libs");
var util_1 = require("./util");
function toPackages(moduleDirs) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var packages, _i, moduleDirs_1, pattern, matches, _a, matches_1, path, _b, _c, findPackage;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    packages = [];
                    _i = 0, moduleDirs_1 = moduleDirs;
                    _d.label = 1;
                case 1:
                    if (!(_i < moduleDirs_1.length)) return [3, 7];
                    pattern = moduleDirs_1[_i];
                    return [4, libs_1.fs.glob.find(pattern)];
                case 2:
                    matches = _d.sent();
                    _a = 0, matches_1 = matches;
                    _d.label = 3;
                case 3:
                    if (!(_a < matches_1.length)) return [3, 6];
                    path = matches_1[_a];
                    if (!!path.includes('node_modules/')) return [3, 5];
                    _c = (_b = packages).push;
                    return [4, toPackage(path)];
                case 4:
                    _c.apply(_b, [_d.sent()]);
                    _d.label = 5;
                case 5:
                    _a++;
                    return [3, 3];
                case 6:
                    _i++;
                    return [3, 1];
                case 7:
                    findPackage = function (dep) { return packages.find(function (pkg) { return pkg.name === dep.name; }); };
                    packages.forEach(function (pkg) {
                        pkg.dependencies.forEach(function (dep) {
                            dep.package = findPackage(dep);
                            dep.isLocal = dep.package !== undefined;
                        });
                    });
                    return [2, packages];
            }
        });
    });
}
exports.toPackages = toPackages;
function toPackage(packageFilePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var parse, json, dependencies, addDeps, version, dir, hasScripts, hasPrepublish, tsconfigPath, isTypeScript, tsconfig, _a, gitignorePath, gitignore, _b, engine;
        var _this = this;
        return tslib_1.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    parse = function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var text, json_1, error_1;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4, libs_1.fs.readFile(packageFilePath)];
                                case 1:
                                    text = (_a.sent()).toString();
                                    json_1 = JSON.parse(text);
                                    return [2, json_1];
                                case 2:
                                    error_1 = _a.sent();
                                    throw new Error("Failed to parse '" + packageFilePath + "'. " + error_1.message);
                                case 3: return [2];
                            }
                        });
                    }); };
                    return [4, parse()];
                case 1:
                    json = _c.sent();
                    dependencies = [];
                    addDeps = function (deps, isDev) {
                        if (!deps) {
                            return;
                        }
                        Object.keys(deps).forEach(function (name) {
                            return dependencies.push({
                                name: name,
                                version: deps[name],
                                isDev: isDev,
                                isLocal: false,
                            });
                        });
                    };
                    addDeps(json.dependencies, false);
                    addDeps(json.peerDependencies, false);
                    addDeps(json.devDependencies, true);
                    dependencies = libs_1.R.sortBy(libs_1.R.prop('name'), dependencies);
                    dependencies = libs_1.R.uniqBy(function (dep) { return dep.name; }, dependencies);
                    version = json.version;
                    dir = libs_1.fs.resolve(packageFilePath, '..');
                    hasScripts = json.scripts !== undefined;
                    hasPrepublish = hasScripts && json.scripts.prepublish !== undefined;
                    tsconfigPath = libs_1.fs.join(dir, 'tsconfig.json');
                    return [4, libs_1.fs.pathExists(tsconfigPath)];
                case 2:
                    isTypeScript = _c.sent();
                    if (!isTypeScript) return [3, 4];
                    return [4, libs_1.fs.readJson(tsconfigPath)];
                case 3:
                    _a = _c.sent();
                    return [3, 5];
                case 4:
                    _a = undefined;
                    _c.label = 5;
                case 5:
                    tsconfig = _a;
                    gitignorePath = libs_1.fs.join(dir, '.gitignore');
                    return [4, libs_1.fs.pathExists(gitignorePath)];
                case 6:
                    if (!(_c.sent())) return [3, 8];
                    return [4, libs_1.fs.readFile(gitignorePath)];
                case 7:
                    _b = (_c.sent()).toString().split('\n');
                    return [3, 9];
                case 8:
                    _b = [];
                    _c.label = 9;
                case 9:
                    gitignore = _b;
                    return [4, getEngine(dir)];
                case 10:
                    engine = _c.sent();
                    return [2, {
                            engine: engine,
                            dir: dir,
                            name: json.name,
                            version: version,
                            latest: version,
                            isTypeScript: isTypeScript,
                            gitignore: gitignore,
                            hasScripts: hasScripts,
                            hasPrepublish: hasPrepublish,
                            tsconfig: tsconfig,
                            isIgnored: false,
                            dependencies: dependencies,
                            json: json,
                        }];
            }
        });
    });
}
function getEngine(dir) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var exists;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    exists = function (file) { return libs_1.fs.pathExists(libs_1.fs.join(dir, file)); };
                    return [4, exists('yarn.lock')];
                case 1:
                    if (_a.sent()) {
                        return [2, 'YARN'];
                    }
                    return [4, exists('package-lock.json')];
                case 2:
                    if (_a.sent()) {
                        return [2, 'NPM'];
                    }
                    return [2, 'NPM'];
            }
        });
    });
}
function orderByDepth(packages) {
    var toDependenciesArray = function (pkg) {
        var deps = pkg.dependencies;
        var result = deps.map(function (dep) { return dep.name; }).map(function (name) { return [pkg.name, name]; });
        return deps.length === 0 ? [[pkg.name]] : result;
    };
    var graph = packages
        .map(function (pkg) { return toDependenciesArray(pkg); })
        .reduce(function (acc, items) {
        items.forEach(function (item) { return acc.push(item); });
        return acc;
    }, []);
    var names = toposort(graph).reverse();
    var result = names.map(function (name) { return libs_1.R.find(libs_1.R.propEq('name', name), packages); });
    return libs_1.R.reject(libs_1.R.isNil, result);
}
exports.orderByDepth = orderByDepth;
function dependsOn(pkg, modules) {
    var result = modules.filter(function (module) { return module.dependencies.find(function (dep) { return dep.name === pkg.name; }) !== undefined; });
    return util_1.compact(result);
}
exports.dependsOn = dependsOn;
function updatePackageRef(target, moduleName, newVersion, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, save, changed, prefix;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = (options || {}).save, save = _a === void 0 ? false : _a;
                    changed = false;
                    prefix = function (version) {
                        return ['^', '~'].filter(function (p) { return version && version.startsWith(p); })[0] || '';
                    };
                    ['dependencies', 'devDependencies', 'peerDependencies'].forEach(function (key) {
                        var obj = target.json[key];
                        if (obj && obj[moduleName]) {
                            var currentValue = obj[moduleName];
                            var newValue = "" + prefix(currentValue) + newVersion;
                            if (newValue !== currentValue) {
                                obj[moduleName] = newValue;
                                changed = true;
                            }
                        }
                    });
                    if (!(save && changed)) return [3, 2];
                    return [4, savePackage(target.dir, target.json)];
                case 1:
                    _b.sent();
                    _b.label = 2;
                case 2: return [2, changed];
            }
        });
    });
}
exports.updatePackageRef = updatePackageRef;
function savePackage(dir, json) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var text;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    text = JSON.stringify(json, null, '  ') + "\n";
                    return [4, libs_1.fs.writeFile(libs_1.fs.join(dir, 'package.json'), text)];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.savePackage = savePackage;
