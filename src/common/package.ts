import * as file from './file';
import { fs, fsPath } from './libs';
import { IPackageObject, IPackage } from '../types';



/**
 * Converts a set of module-directory globs to package objects.
 */
export async function toPackages(moduleDirs: string[]) {
  let packages: IPackageObject[] = [];
  for (const pattern of moduleDirs) {
    const matches = await file.glob(pattern);
    for (const path of matches) {
      packages.push(await toPackage(path))
    }
  }
  return packages;
}



/**
 * Loads a [package.json] file.
 */
export async function toPackage(packageJsonPath: string): Promise<IPackageObject> {
  const text = (await fs.readFileAsync(packageJsonPath)).toString();
  const json = JSON.parse(text);
  return {
    path: fsPath.resolve(packageJsonPath, '..'),,
    data: {
      name: json.name,
      version: json.version,
    },
  };
}
