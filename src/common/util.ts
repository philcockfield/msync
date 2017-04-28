import { log, moment } from './libs';
import * as Listr from 'listr';



/**
 * Prints a display title to the console.
 */
export function printTitle(message: string) {
  const HR = '------------------------------------------------------------------------';
  log.info.cyan(HR);
  log.info.cyan(` ${message}`);
  log.info.cyan(HR);
}


/**
 * Invokes a new listr task.
 */
export function listr(tasks?: IListrTask[], options?: IListrOptions) {
  return new Listr(tasks, options);
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
