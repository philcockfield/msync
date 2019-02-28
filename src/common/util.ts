import { log, moment, R } from './libs';

/**
 * Converts a nested set of arrays into a flat single-level array.
 */
export function flatten<T>(list: any): T[] {
  if (!Array.isArray(list)) {
    return list;
  }
  const result: any = list.reduce((a, b) => {
    const value: any = Array.isArray(b) ? flatten(b) : b;
    return a.concat(value);
  }, []);
  return result as T[];
}

export const compact = <T>(value: T[]) =>
  R.pipe(
    R.reject(R.isNil),
    R.reject(R.isEmpty),
  )(value) as T[];

/**
 * Logs to the console with a `silent` switch.
 */
export function write(msg: any, silent?: boolean) {
  if (silent !== true) {
    log.info(msg);
  }
}

/**
 * Creates an elapsed time display string.
 */
export function elapsed(startedAt: Date) {
  const msecs = moment().diff(moment(startedAt));
  const secs = round(moment.duration(msecs).asSeconds(), 2);
  return `${secs}s`;
}

/**
 * Rounds to the given number of decimals.
 */
export function round(value: number, decimals: number) {
  return Number(Math.round((value + 'e' + decimals) as any) + 'e-' + decimals);
}

/**
 * Pauses as a promise.
 */
export function delay(msecs: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), msecs);
  });
}
