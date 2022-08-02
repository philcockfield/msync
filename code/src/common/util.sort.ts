import { IModule } from '../types';
import { R, toposort } from './libs';

/**
 * Retrieves a depth-first dependency order from the given packages.
 */
export function orderByDepth(packages: IModule[]): IModule[] {
  const toDependenciesArray = (pkg: IModule) => {
    const deps = pkg.dependencies;
    const result = deps.map((dep) => dep.name).map((name) => [pkg.name, name]);
    return deps.length === 0 ? [[pkg.name]] : result;
  };

  const graph = packages
    .map((pkg) => toDependenciesArray(pkg))
    .reduce((acc: any[], items: any[]) => {
      items.forEach((item) => acc.push(item));
      return acc;
    }, []);

  const names = toposort<string>(graph).reverse();
  const result = names.map((name) => R.find(R.propEq('name', name), packages));
  return R.reject(R.isNil, result) as IModule[];
}
