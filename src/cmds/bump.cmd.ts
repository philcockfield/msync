import {
  R,
  log,
  loadSettings,
  constants,
  filter,
  IModule,
  inquirer,
  semver,
  dependsOn,
  updatePackageRef,
  savePackage,
} from '../common';
import * as listCommand from './ls.cmd';


export type ReleaseType = 'major' | 'minor' | 'patch';

export const name = 'bump';
export const alias = 'bp';
export const description = 'Bumps a module version and all references to it in dependent modules.';
export const args = {
  '-i': 'Include ignored modules.',
};



/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {
      i?: boolean;
    },
  },
) {
  const options = (args && args.options) || {};
  const includeIgnored = options.i || false;
  await bump({ includeIgnored });
}



export interface IOptions {
  includeIgnored?: boolean;
}

/**
 * Bumps a module version and all references to it in dependent modules.
 */
export async function bump(options: IOptions = {}) {
  const { includeIgnored = false } = options;
  const settings = await loadSettings();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings
    .modules
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored));

  // Prompt for the module to bump.
  const module = await promptForModule(modules);
  if (!module) { return; }

  // Retrieve the dependent modules and list them in a table.
  const dependents = dependsOn(module, modules);
  listCommand.printTable([module], { includeIgnored: true, dependents });

  // Get the version number.
  const release = await promptForReleaseType(module.version);
  if (!release) { return; }
  // const version = semver.inc(module.version, release);

  // Update the selected module and all dependent modules.
  log.info();
  await bumpModule(release, module, modules, 0);
  log.info();

}


async function bumpModule(release: ReleaseType, module: IModule, allModules: IModule[], level: number) {
  // Setup initial conditions.
  const dependents = dependsOn(module, allModules);
  const version = semver.inc(module.version, release);
  const isRoot = level === 0;

  // Log output.
  const indent = '   '.repeat(level);
  const bar = isRoot ? '' : '├─';
  const prefix = log.gray(`${indent}${bar}`);
  log.info.cyan(`${prefix}${release.toUpperCase()} update ${log.magenta(module.name)} to version ${log.magenta(version)}`); // tslint:disable-line

  // Update the selected module.
  const json = R.clone<any>(module.json);
  json.version = version;
  await savePackage(module.dir, json);

  // Update all dependent modules.
  if (isRoot && dependents.length > 0) {
    log.info.gray('\nDependents:');
  }
  for (const pkg of dependents) {
    await bumpModule('patch', pkg, allModules, level + 1);
  }
}



async function promptForModule(modules: IModule[]) {
  const choices = modules.map((pkg) => ({ name: pkg.name, value: pkg.name }));
  const confirm = {
    type: 'list',
    name: 'name',
    message: 'Select a module',
    choices,
  };
  const name = (await inquirer.prompt(confirm)).name;
  return modules.find((pkg) => pkg.name === name);
}



async function promptForReleaseType(version: string) {
  const choices = ['patch', 'minor', 'major'];
  const confirm = {
    type: 'list',
    name: 'name',
    message: 'Release',
    choices,
  };
  return (await inquirer.prompt(confirm)).name;
}

