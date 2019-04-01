import { IModule, INpmInfo } from '../types';
import { npm } from './libs';
import { compact } from './util';

/**
 * Lookup latest info for module from NPM.
 */
export async function info(pkg: IModule | IModule[]) {
  const modules = (Array.isArray(pkg) ? pkg : [pkg]).filter(pkg => pkg.json.private !== true);
  const items = await Promise.all(
    modules.map(async item => {
      try {
        const res = await npm.getInfo(item.name);
        return res;
      } catch (error) {
        const message = `Failed getting NPM info for '${item.name}'. ${error.message}`;
        throw new Error(message);
      }
    }),
  );
  return compact(items) as INpmInfo[];
}
