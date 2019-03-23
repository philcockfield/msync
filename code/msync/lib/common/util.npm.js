"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var libs_1 = require("./libs");
var util_1 = require("./util");
function info(pkg) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var modules, items;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    modules = (Array.isArray(pkg) ? pkg : [pkg]).filter(function (pkg) { return pkg.json.private !== true; });
                    return [4, Promise.all(modules.map(function (item) { return libs_1.npm.getInfo(item.name); }))];
                case 1:
                    items = _a.sent();
                    return [2, util_1.compact(items)];
            }
        });
    });
}
exports.info = info;
