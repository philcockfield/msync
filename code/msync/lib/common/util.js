"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var libs_1 = require("./libs");
function flatten(list) {
    if (!Array.isArray(list)) {
        return list;
    }
    var result = list.reduce(function (a, b) {
        var value = Array.isArray(b) ? flatten(b) : b;
        return a.concat(value);
    }, []);
    return result;
}
exports.flatten = flatten;
exports.compact = function (value) {
    return libs_1.R.pipe(libs_1.R.reject(libs_1.R.isNil), libs_1.R.reject(libs_1.R.isEmpty))(value);
};
function write(msg, silent) {
    if (silent !== true) {
        libs_1.log.info(msg);
    }
}
exports.write = write;
function elapsed(startedAt) {
    var msecs = libs_1.moment().diff(libs_1.moment(startedAt));
    var secs = round(libs_1.moment.duration(msecs).asSeconds(), 2);
    return secs + "s";
}
exports.elapsed = elapsed;
function round(value, decimals) {
    return Number(Math.round((value + 'e' + decimals)) + 'e-' + decimals);
}
exports.round = round;
function delay(msecs) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () { return resolve(); }, msecs);
    });
}
exports.delay = delay;
