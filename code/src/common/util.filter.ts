import { fs } from './libs';
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

export async function fileExists(paths: string[]) {
  const checking = paths.map(async path => {
    const exists = await fs.pathExists(path);
    return { path, exists };
  });
  const results = await Promise.all(checking);
  return results.filter(result => result.exists).map(result => result.path);
}
