import * as file from './util.file';
import { R, fs, fsPath } from './libs';
import { IPackageObject, IDependency } from '../types';



/**
 * Converts a set of module-directory globs to package objects.
 */
export async function toPackages(moduleDirs: string[]) {
  const packages: IPackageObject[] = [];
  for (const pattern of moduleDirs) {
    const matches = await file.glob(pattern);
    for (const path of matches) {
      packages.push(await toPackage(path));
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

  let dependencies: IDependency[] = [];
  const addDeps = (deps: { [key: string]: string }, isDev: boolean) => {
    if (!deps) { return; }
    Object.keys(deps).forEach((name) => dependencies.push({ name, version: deps[name], isDev }));
  };

  addDeps(json.dependencies, false);
  addDeps(json.peerDependencies, false);
  addDeps(json.devDependencies, true);
  dependencies = R.sortBy(R.prop('name'), dependencies);
  dependencies = R.uniqBy((dep) => dep.name, dependencies);

  return {
    path: fsPath.resolve(packageJsonPath, '..'),
    name: json.name,
    version: json.version,
    dependencies,
  };
}
