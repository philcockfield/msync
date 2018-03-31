import { exec } from './libs';
import { compact } from './util';
import { IModule, INpmInfo } from '../types';

/**
 * Lookup latest info for module from NPM.
 */
export async function info(pkg: IModule | IModule[]) {
  const modules = (Array.isArray(pkg) ? pkg : [pkg]).filter(
    pkg => pkg.json.private !== true,
  );
  const items = await Promise.all(modules.map(item => getInfo(item)));
  return compact(items) as INpmInfo[];
}

async function getInfo(pkg: IModule): Promise<INpmInfo | undefined> {
  const cmd = `yarn info ${pkg.name} --json`;
  try {
    const result = await exec.run(cmd, { silent: true });
    if (!result.stdout) {
      return undefined;
    }
    const json = JSON.parse(result.stdout);
    const latest = json.data['dist-tags'].latest;
    const name = json.data.name;
    return {
      name,
      latest,
      json,
    };
  } catch (error) {
    if (error.message.includes('Not found')) {
      return undefined; // Return nothing indicating the module was not found on NPM.
    } else {
      throw new Error(
        `Failed while reading info for '${pkg.name}' from NPM.\n\n${
          error.message
        }`,
      );
    }
  }
}
