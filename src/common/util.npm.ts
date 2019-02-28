import { IModule, INpmInfo } from '../types';
import { npm } from './libs';
import { compact } from './util';

/**
 * Lookup latest info for module from NPM.
 */
export async function info(pkg: IModule | IModule[]) {
  const modules = (Array.isArray(pkg) ? pkg : [pkg]).filter(pkg => pkg.json.private !== true);
  const items = await Promise.all(modules.map(item => npm.getInfo(item.name)));
  return compact(items) as INpmInfo[];
}
