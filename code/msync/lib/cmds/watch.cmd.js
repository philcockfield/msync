"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var command_interface_1 = require("command-interface");
exports.name = 'watch';
exports.alias = 'w';
exports.description = 'Starts watchers for `build` and `sync` in new tabs.';
exports.args = {};
function cmd(args) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var path;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    path = process.cwd();
                    return [4, command_interface_1.exec.inNewTab("msync sync -w", path)];
                case 1:
                    _a.sent();
                    return [4, command_interface_1.exec.inNewTab("msync build -w", path)];
                case 2:
                    _a.sent();
                    return [2];
            }
        });
    });
}
exports.cmd = cmd;
