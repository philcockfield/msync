import * as toposort from 'toposort';

import { IDependency, IModule } from '../types';
import { file, fs, R } from './libs';
import { compact } from './util';

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
  const findPackage = (dep: IDependency) => packages.find(pkg => pkg.name === dep.name);
  packages.forEach(pkg => {
    pkg.dependencies.forEach(dep => {
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
  // Setup initial conditions.
  const parse = async () => {
    try {
      const text = (await fs.readFile(packageFilePath)).toString();
      const json = JSON.parse(text);
      return json;
    } catch (error) {
      throw new Error(`Failed to parse '${packageFilePath}'. ${error.message}`);
    }
  };

  const json = await parse();

  // Dependencies.
  let dependencies: IDependency[] = [];
  const addDeps = (deps: { [key: string]: string }, isDev: boolean) => {
    if (!deps) {
      return;
    }
    Object.keys(deps).forEach(name =>
      dependencies.push({
        name,
        version: deps[name],
        isDev,
        isLocal: false,
      }),
    );
  };
  addDeps(json.dependencies, false);
  addDeps(json.peerDependencies, false);
  addDeps(json.devDependencies, true);
  dependencies = R.sortBy(R.prop('name'), dependencies);
  dependencies = R.uniqBy((dep: IDependency) => dep.name, dependencies);

  // Derive useful values.
  const version = json.version;
  const dir = fs.resolve(packageFilePath, '..');
  const hasScripts = json.scripts !== undefined;
  const hasPrepublish = hasScripts && json.scripts.prepublish !== undefined;

  // Load typescript config.
  const tsconfigPath = fs.join(dir, 'tsconfig.json');
  const isTypeScript = await fs.pathExists(tsconfigPath);
  const tsconfig = isTypeScript ? await fs.readJson(tsconfigPath) : undefined;

  // Load .gitignore file.
  const gitignorePath = fs.join(dir, '.gitignore');
  const gitignore = (await fs.pathExists(gitignorePath))
    ? (await fs.readFile(gitignorePath)).toString().split('\n')
    : [];

  // Determine which CLI engine to use.
  const engine = await getEngine(dir);

  // Finish up.
  return {
    engine,
    dir,
    name: json.name,
    version,
    latest: version,
    isTypeScript,
    gitignore,
    hasScripts,
    hasPrepublish,
    tsconfig,
    isIgnored: false, // NB: Set later once the entire set of modules exists.
    dependencies,
    json,
  };
}

/**
 * Determine which CLI engine the module is using (YARN or NPM).
 */
async function getEngine(dir: string): Promise<IModule['engine']> {
  const exists = (file: string) => fs.pathExists(fs.join(dir, file));
  if (await exists('yarn.lock')) {
    return 'YARN';
  }
  if (await exists('package-lock.json')) {
    return 'NPM';
  }
  return 'NPM'; // Default.
}

/**
 * Retrieves a depth-first dependency order from the given packages.
 */
export function orderByDepth(packages: IModule[]): IModule[] {
  const toDependenciesArray = (pkg: IModule) => {
    const deps = pkg.dependencies;
    const result = deps.map(dep => dep.name).map(name => [pkg.name, name]);
    return deps.length === 0 ? [[pkg.name]] : result;
  };

  const graph = packages
    .map(pkg => toDependenciesArray(pkg))
    .reduce((acc: any[], items: any[]) => {
      items.forEach(item => acc.push(item));
      return acc;
    }, []);

  const names = toposort<string>(graph).reverse();
  const result = names.map(name => R.find(R.propEq('name', name), packages));
  return R.reject(R.isNil, result) as IModule[];
}

/**
 * Retrieves the set of modules that depend upon the given package.
 */
export function dependsOn(pkg: IModule, modules: IModule[]) {
  const result = modules.filter(
    module => module.dependencies.find(dep => dep.name === pkg.name) !== undefined,
  );
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
  const prefix = (version: string) =>
    ['^', '~'].filter(p => version && version.startsWith(p))[0] || '';
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach(key => {
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

  // Save the [package.json] file.
  if (save && changed) {
    await savePackage(target.dir, target.json);
  }

  // Finish up.
  return changed;
}

/**
 * Saves the given package JSON.
 */
export async function savePackage(dir: string, json: object) {
  const text = `${JSON.stringify(json, null, '  ')}\n`;
  await fs.writeFile(fs.join(dir, 'package.json'), text);
}
