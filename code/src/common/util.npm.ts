import * as t from './types';
import { npm, defaultValue } from './libs';

/**
 * Lookup latest info for module from NPM.
 */
export async function info(
  pkg: t.IModule | t.IModule[],
  options: {
    batchSize?: number;
    onModuleRead?: (pkg: t.IModule) => void;
  } = {},
) {
  const { onModuleRead } = options;
  const modules = (Array.isArray(pkg) ? pkg : [pkg]).filter((pkg) => pkg.json.private !== true);
  const batchSize = defaultValue(options.batchSize, 20);

  const getInfo = async (pkg: t.IModule) => {
    try {
      const name = pkg.name;
      const version = pkg.version;
      const latest = await npm.getVersion(pkg.name);
      if (onModuleRead) {
        onModuleRead(pkg);
      }
      const res: t.INpmInfo = { name, version, latest };
      return res;
    } catch (error: any) {
      const message = `Failed getting NPM info for '${pkg.name}'. ${error.message}`;
      throw new Error(message);
    }
  };

  let res: t.INpmInfo[] = [];
  for (const batch of chunk(batchSize, modules)) {
    const items = await Promise.all(batch.map((pkg) => getInfo(pkg)));
    res = [...res, ...items];
  }

  return res;
}

/**
 * [Helpers]
 */
function chunk<T>(size: number, items: T[]) {
  const chunks = Math.ceil(items.length / size);
  const result: T[][] = [];
  let i = 0;
  while (i < chunks) {
    result[i] = items.splice(0, size);
    i++;
  }
  return result;
}
