import * as toposort from 'toposort';
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
export async function toPackage(packageFilePath: string): Promise<IPackageObject> {
  const text = (await fs.readFileAsync(packageFilePath)).toString();
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
    path: fsPath.resolve(packageFilePath, '..'),
    name: json.name,
    version: json.version,
    dependencies,
  };
}



/**
 * Retrieves a depth-first dependency order from the given packages.
 */
export function orderByDepth(packages: IPackageObject[]): IPackageObject[] {
  const toDependenciesArray = (pkg: IPackageObject) => {
    const deps = pkg.dependencies;
    const result = deps
      .map((dep) => dep.name)
      .map((name) => [pkg.name, name])
    return deps.length === 0
      ? [[pkg.name]]
      : result;
  };

  const graph = packages
    .map((pkg) => toDependenciesArray(pkg))
    .reduce((acc: any[], items: any[]) => {
      items.forEach((item) => acc.push(item));
      return acc;
    }, []);

  const names = toposort<string>(graph).reverse();
  const result = names.map((name) => R.find(R.propEq('name', name), packages));
  return R.reject(R.isNil, result);
}
