import * as file from './file';
import * as constants from './constants';
import { R, jsYaml, fs, fsPath, log } from './libs';
import { toPackages } from './package';
import { IPackageObject } from '../types';


export interface IConfigYaml {
  modules?: string[];
}



/**
 * Finds and loads the YAML configuration file.
 */
async function loadConfigYaml(): Promise<IConfigYaml | undefined> {
  const path = await file.findClosestAncestor(process.cwd(), constants.CONFIG_FILE_NAME);
  if (path) {
    try {
      const text = (await fs.readFileAsync(path)).toString();
      return jsYaml.safeLoad(text);
    } catch (error) {
      log.error(`Failed to parse YAML configuration`);
      log.error(error.message);
      log.info(log.magenta('File:'), path, '\n');
    }
  }
  return {};
}




/**
 * Initializes the settings.
 */
export async function init() {
  const yaml = await loadConfigYaml();
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
    modules
  };
}
