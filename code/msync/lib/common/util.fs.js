"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var libs_1 = require("./libs");
function tryDelete(path, options) {
    if (options === void 0) { options = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var retry, count, error_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    retry = options.retry === undefined ? 3 : options.retry;
                    count = 0;
                    _a.label = 1;
                case 1:
                    count++;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4, libs_1.fs.remove(path)];
                case 3:
                    _a.sent();
                    return [3, 5];
                case 4:
                    error_1 = _a.sent();
                    if (count >= retry) {
                        throw error_1;
                    }
                    return [3, 5];
                case 5:
                    if (count < retry) return [3, 1];
                    _a.label = 6;
                case 6: return [2];
            }
        });
    });
}
exports.tryDelete = tryDelete;
