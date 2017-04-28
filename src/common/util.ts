import { log } from './libs';
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
