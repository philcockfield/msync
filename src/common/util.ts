import { log } from './libs';


/**
 * Prints a display title to the console.
 */
export function printTitle(message: string) {
  const HR = '------------------------------------------------------------------------';
  log.info.cyan(HR);
  log.info.cyan(` ${message}`);
  log.info.cyan(HR);
}
