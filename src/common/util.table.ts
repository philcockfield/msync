import { log } from './libs';
import { compact } from './util';
const Table = require('cli-table');





/**
 * Creates a new table builder.
 */
export function table(head: Array<string | undefined> = []) {
  head = compact(head);
  const t = new Table({ head });
  const api = {
    add(...rows: Array<string | undefined>) {
      t.push(rows.map((row) => row === undefined ? '' : row));
      return api;
    },
    toString() { return t.toString(); },
    log() { log.info(api.toString()); return api; },
  };
  return api;
}
