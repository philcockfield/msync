import {
  IPackageObject,
  IDependency,
} from '../types';

export const localDeps = (pkg: IPackageObject) => {
  return pkg.dependencies.filter((dep: IDependency) => dep.isLocal);
};

export const showIgnored = (pkg: IPackageObject | undefined, showIgnored: boolean) => {
  if (!pkg) { return true; }
  return showIgnored ? true : !pkg.isIgnored;
};
