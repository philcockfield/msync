import { fs, fsPath, chokidar, Subject } from './libs';
import { Glob } from 'glob';



/**
 * Walks up the folder tree looking for the given file.
 */
export async function findClosestAncestor(startDir: string, fileName: string) {
  const find = async (dir: string): Promise<string | undefined> => {
    if (!dir || dir === '/') { return; }
    const path = fsPath.join(dir, fileName);
    return (await fs.existsAsync(path))
      ? path
      : (await find(fsPath.resolve(dir, '..')));
  };
  return find(startDir);
}



/**
 * Gets all files within the given directory.
 */
export function glob(pattern: string): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    new Glob(pattern, {}, (err, matches) => { // tslint:disable-line
      if (err) {
        reject(err);
      } else {
        resolve(matches);
      }
    });
  });
}



/**
 * Watches the given file/folder pattern.
 */
export function watch(pattern: string) {
  const subject = new Subject<string>();
  chokidar
    .watch(pattern)
    .on('change', (path: string) => subject.next(path));
  return subject;
}
