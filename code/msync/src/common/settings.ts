import { Observable } from 'rxjs';

import { IModule } from '../types';
import * as constants from './constants';
import { file, fs, listr, log, semver } from './libs';
import * as npm from './util.npm';
import { orderByDepth, toPackages } from './util.package';

export interface IIgnore {
  paths: string[];
  names: string[];
}

export interface IYaml {
  modules: string[];
  ignore: IIgnore;
  watchPattern: string;
}

export interface ISettings {
  path: string;
  modules: IModule[];
  ignored: IIgnore;
  watchPattern: string;
}

export interface IOptions {
  npm?: boolean;
  spinner?: boolean;
}

/**
 * Initializes the settings.
 */
export async function loadSettings(options: IOptions = {}): Promise<ISettings | undefined> {
  const { spinner = false, npm = false } = options;

  if (spinner) {
    // Load the settings with a spinner.
    let result: ISettings | undefined;
    const title = npm ? 'Loading module info locally and from NPM' : 'Loading module info locally';
    const task = {
      title,
      task: () =>
        new Observable<string>(observer => {
          observer.next('Calculating number of modules...');
          (async () => {
            const onTotal = (total: number) => observer.next(`Querying ${total} modules`);
            result = await read({ ...options, onTotal });
            observer.complete();
          })();
        }),
    };
    await listr([task]).run();
    log.info();
    return result;
  } else {
    // No spinner.
    return read(options);
  }
}

/**
 * [Internal]
 */

async function read(
  options: IOptions & { onTotal?: (total: number) => void } = {},
): Promise<ISettings | undefined> {
  // Find the configuration YAML file.
  const path = await file.findClosestAncestor(process.cwd(), constants.CONFIG_FILE_NAME);
  if (!path) {
    return;
  }

  // Load the YAML.
  const yaml = await loadYaml(path);
  if (!yaml) {
    return;
  }

  // Resolve all module-directories in the YAML to
  // be within the "current working directory".
  const dir = fs.dirname(path);
  yaml.modules = yaml.modules.map(path => fs.resolve(dir, path));

  // Load the [package.json] from files and setup depth order.
  let modules = await toPackages(yaml.modules);
  modules = orderByDepth(modules);

  // Flag ignored packages.
  const ignore = {
    paths: await ignorePaths(yaml, dir),
    names: yaml.ignore.names,
  };
  modules.forEach(pkg => (pkg.isIgnored = isIgnored(pkg, ignore)));

  if (options.onTotal) {
    options.onTotal(modules.length);
  }

  // NPM.
  if (options.npm) {
    const npmModules = await npm.info(modules.filter(pkg => !pkg.isIgnored));
    modules.forEach(pkg => {
      pkg.npm = npmModules.find(item => item.name === pkg.name);
      if (pkg.npm?.latest && semver.gt(pkg.npm.latest, pkg.version)) {
        pkg.latest = pkg.npm.latest;
      }
    });
  }

  // Finish up.
  return {
    path,
    ignored: ignore,
    watchPattern: yaml.watchPattern,
    modules,
  };
}

async function ignorePaths(yaml: IYaml, dir: string) {
  const result = [] as string[];
  for (const pattern of yaml.ignore.paths) {
    const paths = await fs.glob.find(fs.resolve(dir, pattern));
    paths.forEach(path => result.push(path));
  }
  return result;
}

function isIgnored(pkg: IModule, ignore: IIgnore) {
  if (ignore.names.includes(pkg.name)) {
    return true;
  }
  for (const path of ignore.paths) {
    if (pkg.dir.startsWith(path)) {
      return true;
    }
  }
  return false;
}

/**
 * Finds and loads the YAML configuration file.
 */
async function loadYaml(path: string) {
  try {
    const result = await file.yaml<IYaml>(path);

    // Fill in default values.
    result.modules = result.modules || [];
    result.ignore = result.ignore || { paths: [] };
    result.ignore.paths = result.ignore.paths || [];
    result.ignore.names = result.ignore.names || [];
    result.watchPattern = result.watchPattern || constants.DEFAULT_WATCH_PATTERN;

    return result;
  } catch (error) {
    log.error(`Failed to parse YAML configuration.`);
    log.error(error.message);
    log.info(log.magenta('File:'), path, '\n');
  }
  return;
}
