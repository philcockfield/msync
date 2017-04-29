import {
  IPackageObject,
  IDependency,
} from '../types';


export const localDeps = (pkg: IPackageObject) => {
  return pkg.dependencies.filter((dep: IDependency) => dep.isLocal);
};


export const includeIgnored = (pkg: IPackageObject | undefined, includeIgnored: boolean) => {
  if (!pkg) { return true; }
  return includeIgnored ? true : !pkg.isIgnored;
};
