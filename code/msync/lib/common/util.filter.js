"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var libs_1 = require("./libs");
exports.localDeps = function (pkg) {
    return pkg.dependencies.filter(function (dep) { return dep.isLocal; });
};
exports.includeIgnored = function (pkg, includeIgnored) {
    if (!pkg) {
        return true;
    }
    return includeIgnored ? true : !pkg.isIgnored;
};
function fileExists(paths) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var checking, results;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    checking = paths.map(function (path) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var exists;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, libs_1.fs.pathExists(path)];
                                case 1:
                                    exists = _a.sent();
                                    return [2, { path: path, exists: exists }];
                            }
                        });
                    }); });
                    return [4, Promise.all(checking)];
                case 1:
                    results = _a.sent();
                    return [2, results.filter(function (result) { return result.exists; }).map(function (result) { return result.path; })];
            }
        });
    });
}
exports.fileExists = fileExists;
