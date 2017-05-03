import * as toposort from 'toposort';
import { R, fs, fsPath, file } from './libs';
import { compact } from './util';
import { IModule, IDependency } from '../types';




/**
 * Converts a set of module-directory globs to package objects.
 */
export async function toPackages(moduleDirs: string[]) {
  const packages: IModule[] = [];

  // Build list of packages.
  for (const pattern of moduleDirs) {
    const matches = await file.glob(pattern);
    for (const path of matches) {
      if (!path.includes('node_modules/')) {
        packages.push(await toPackage(path));
      }
    }
  }

  // Determine which ones are local.
  const findPackage = (dep: IDependency) => packages.find((pkg) => pkg.name === dep.name);
  packages.forEach((pkg) => {
    pkg.dependencies.forEach((dep) => {
      dep.package = findPackage(dep);
      dep.isLocal = dep.package !== undefined;
    });
  });

  // Finish up.
  return packages;
}



/**
 * Loads a [package.json] file.
 */
async function toPackage(packageFilePath: string): Promise<IModule> {
  const text = (await fs.readFileAsync(packageFilePath)).toString();
  const json = JSON.parse(text);

  let dependencies: IDependency[] = [];
  const addDeps = (deps: { [key: string]: string }, isDev: boolean) => {
    if (!deps) { return; }
    Object.keys(deps).forEach((name) => dependencies.push({
      name,
      version: deps[name],
      isDev,
      isLocal: false,
    }));
  };

  addDeps(json.dependencies, false);
  addDeps(json.peerDependencies, false);
  addDeps(json.devDependencies, true);
  dependencies = R.sortBy(R.prop('name'), dependencies);
  dependencies = R.uniqBy((dep: IDependency) => dep.name, dependencies);

  const dir = fsPath.resolve(packageFilePath, '..');
  const isTypeScript = await fs.existsAsync(fsPath.join(dir, 'tsconfig.json'));

  return {
    dir,
    name: json.name,
    version: json.version,
    isTypeScript,
    isIgnored: false, // NB: Set later once the entire set of modules exists.
    dependencies,
    json,
  };
}



/**
 * Retrieves a depth-first dependency order from the given packages.
 */
export function orderByDepth(packages: IModule[]): IModule[] {
  const toDependenciesArray = (pkg: IModule) => {
    const deps = pkg.dependencies;
    const result = deps
      .map((dep) => dep.name)
      .map((name) => [pkg.name, name]);
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



/**
 * Retrieves the set of modules that depend upon the given package.
 */
export function dependsOn(pkg: IModule, modules: IModule[]) {
  const result = modules
    .filter((module) =>
      module
        .dependencies
        .find((dep) => dep.name === pkg.name) !== undefined);
  return compact<IModule>(result);
}



/**
 * Updates the version from the given source module onto the target module.
 */
export async function updatePackageRef(
  target: IModule,
  moduleName: string,
  newVersion: string,
  options: { save: boolean },
) {
  const { save = false } = options || {};
  let changed = false;

  // Update the version on the target JSON.
  const prefix = (version: string) => ['^', '~'].filter((p) => version && version.startsWith(p))[0] || '';
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach((key) => {
    const obj = target.json[key];
    if (obj && obj[moduleName]) {
      const currentValue = obj[moduleName];
      const newValue = `${prefix(currentValue)}${newVersion}`;
      if (newValue !== currentValue) {
        obj[moduleName] = newValue;
        changed = true;
      }
    }
  });

  // Save the package.json file.
  if (save && changed) {
    const text = `${JSON.stringify(target.json, null, '  ')}\n`;
    await fs.writeFileAsync(fsPath.join(target.dir, 'package.json'), text);
  }
}
