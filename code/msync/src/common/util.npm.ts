import * as t from '../types';
import { npm } from './libs';
import { compact } from './util';

/**
 * Lookup latest info for module from NPM.
 */
export async function info(pkg: t.IModule | t.IModule[]) {
  const modules = (Array.isArray(pkg) ? pkg : [pkg]).filter(pkg => pkg.json.private !== true);
  const items = await Promise.all(
    modules.map(async item => {
      try {
        const name = item.name;
        const version = item.version;
        const latest = await npm.getVersion(item.name);
        const res: t.INpmInfo = { name, version, latest };
        return res;
      } catch (error) {
        const message = `Failed getting NPM info for '${item.name}'. ${error.message}`;
        throw new Error(message);
      }
    }),
  );
  return compact(items) as t.INpmInfo[];
}
