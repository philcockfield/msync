import * as Rsync from 'rsync';
import { fsPath, fs } from './libs';


interface IRsyncResult {
  err: Error;
  code: number;
  cmd: string;
}
function rsyncExecute(rsync: any): Promise<IRsyncResult> {
  return new Promise<IRsyncResult>((resolve, reject) => {
    rsync.execute((err: Error, code: number, cmd: string) => {
      if (err) {
        reject(err);
      } else {
        resolve({ err, code, cmd });
      }
    });
  });
}


/**
 * Copies the module using RSync.
 */
export async function module(
  from: { name: string, dir: string },
  to: { name: string, dir: string },
) {
  const IGNORE = [
    '.DS_Store',
    'node_modules',
    '.tmp',
  ];
  const FROM_DIR = fsPath.join(from.dir, '/');
  const TO_DIR = fsPath.join(to.dir, 'node_modules', from.name, '/');
  await fs.ensureDirAsync(TO_DIR);

  const rsync = new Rsync()
    .source(FROM_DIR)
    .destination(TO_DIR)
    .exclude(IGNORE)
    .delete()
    .flags('aW');
  await rsyncExecute(rsync);
}

