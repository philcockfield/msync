import * as file from './util.file';
import * as constants from './constants';
import { R, jsYaml, fs, fsPath, log } from './libs';
import { toPackages } from './util.package';
import { IPackageObject } from '../types';


export interface IConfigYaml {
  modules?: string[];
}



/**
 * Finds and loads the YAML configuration file.
 */
async function loadConfigYaml(path: string) {
  try {
    const text = (await fs.readFileAsync(path)).toString();
    return jsYaml.safeLoad(text) as IConfigYaml;
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
export async function init() {

  // Find the configuration YAML file.
  const path = await file.findClosestAncestor(process.cwd(), constants.CONFIG_FILE_NAME);
  if (!path) { return; }

  // Load the YAML.
  const yaml = await loadConfigYaml(path);
  if (!yaml) { return; }

  // Resolve all module-directories in the YAML to
  // be within the "current working directory".
  yaml.modules = (yaml.modules || [])
    .map((path) => fsPath.resolve(process.cwd(), path));

  // Load the [package.json] from files.
  let modules = await toPackages(yaml.modules);
  modules = R.sortBy(R.prop('name'), modules);

  // Finish up.
  return {
    path,
    modules,
  };
}