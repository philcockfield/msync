import { IModule, IDependency } from '../types';

export const localDeps = (pkg: IModule) => {
  return pkg.dependencies.filter((dep: IDependency) => dep.isLocal);
};

export const includeIgnored = (
  pkg: IModule | undefined,
  includeIgnored: boolean,
) => {
  if (!pkg) {
    return true;
  }
  return includeIgnored ? true : !pkg.isIgnored;
};
