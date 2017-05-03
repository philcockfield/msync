import { exec } from './libs';
import { compact } from './util';
import { IModule } from '../types';


export interface INpmInfo {
  latest: string;
  json: object;
  module: IModule;
}


/**
 * Lookup latest info for module from NPM.
 */
export async function info(pkg: IModule | IModule[]) {
  const modules = Array.isArray(pkg) ? pkg : [pkg];
  const items = await Promise.all(modules.map((item) => getInfo(item)));
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
    return {
      latest,
      json,
      module: pkg,
    };
  } catch (error) {
    throw new Error(`Failed to read NPM info for '${pkg.name}'. ${error.message}`);
  }
}
