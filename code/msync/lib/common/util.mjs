import { log, moment, R } from './libs';
export function flatten(list) {
    if (!Array.isArray(list)) {
        return list;
    }
    const result = list.reduce((a, b) => {
        const value = Array.isArray(b) ? flatten(b) : b;
        return a.concat(value);
    }, []);
    return result;
}
export const compact = (value) => R.pipe(R.reject(R.isNil), R.reject(R.isEmpty))(value);
export function write(msg, silent) {
    if (silent !== true) {
        log.info(msg);
    }
}
export function elapsed(startedAt) {
    const msecs = moment().diff(moment(startedAt));
    const secs = round(moment.duration(msecs).asSeconds(), 2);
    return `${secs}s`;
}
export function round(value, decimals) {
    return Number(Math.round((value + 'e' + decimals)) + 'e-' + decimals);
}
export function delay(msecs) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), msecs);
    });
}
