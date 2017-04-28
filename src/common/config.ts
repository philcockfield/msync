import * as file from './util.file';
import * as constants from './constants';
import { jsYaml, fs, fsPath, log } from './libs';
import { toPackages, orderByDepth } from './util.package';
import { IPackageObject } from '../types';

export interface IIgnore {
  paths: string[];
}

export interface IConfigYaml {
  modules: string[];
  ignore: IIgnore;
}

export interface IConfig {
  path: string;
  modules: IPackageObject[];
  ignored: IIgnore;
}


/**
 * Finds and loads the YAML configuration file.
 */
async function loadConfigYaml(path: string) {
  try {
    const text = (await fs.readFileAsync(path)).toString();
    const result = jsYaml.safeLoad(text) as IConfigYaml;

    result.modules = result.modules || [];
    result.ignore = result.ignore || { paths: [] };
    result.ignore.paths = result.ignore.paths || [];

    return result;
  } catch (error) {
    log.error(`Failed to parse YAML configuration`);
    log.error(error.message);
    log.info(log.magenta('File:'), path, '\n');
  }
  return;
}




/**
 * Initializes the settings.
 */
export async function init(): Promise<IConfig | undefined> {

  // Find the configuration YAML file.
  const path = await file.findClosestAncestor(process.cwd(), constants.CONFIG_FILE_NAME);
  if (!path) { return; }

  // Load the YAML.
  const yaml = await loadConfigYaml(path);
  if (!yaml) { return; }

  // Resolve all module-directories in the YAML to
  // be within the "current working directory".
  const dir = fsPath.dirname(path);
  yaml.modules = yaml.modules.map((path) => fsPath.resolve(dir, path));

  // Ignore
  const ignore = {
    paths: await ignorePaths(yaml, dir)
  };

  // Load the [package.json] from files.
  let modules = await toPackages(yaml.modules);
  modules = modules.filter((pkg) => !isIgnored(pkg, ignore));
  modules = orderByDepth(modules);

  // Finish up.
  return {
    path,
    modules,
    ignored: ignore,
  };
}


async function ignorePaths(yaml: IConfigYaml, dir: string) {
  const result = [] as string[];
  for (const pattern of yaml.ignore.paths) {
    const paths = await file.glob(fsPath.resolve(dir, pattern))
    paths.forEach((path) => result.push(path));
  }
  return result;
}


function isIgnored(pkg: IPackageObject, ignore: IIgnore) {
  for (const path of ignore.paths) {
    if (pkg.dir.startsWith(path)) { return true; }
  }
  return false;
}


