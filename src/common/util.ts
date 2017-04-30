import { R, moment } from './libs';


export const compact = <T>(value: T[]) => R.pipe(
  R.reject(R.isNil),
  R.reject(R.isEmpty),
)(value) as T[];





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
  return Number(Math.round(value + 'e' + decimals as any) + 'e-' + decimals);
}


/**
 * Pauses as a promise.
 */
export function delay(msecs: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), msecs);
  });
}
