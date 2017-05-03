import {
  log,
  loadSettings,
  constants,
  filter,
  IModule,
  inquirer,
  dependsOn,
  semver,
} from '../common';
import * as listCommand from './ls.cmd';


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
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored))

  // Prompt for the module to bump.
  const module = await promptForModule(modules);
  if (!module) { return; }

  // Retrieve the dependent modules and list them in a table.
  const dependents = dependsOn(module, modules);
  listCommand.printTable([module], { includeIgnored: true, dependents });

  // Get the version number.
  const version = await promptForVersion(module.version);
  log.info.cyan(`\nUpdate ${log.magenta(module.name)} to version ${log.magenta(version)}\n`);

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



async function promptForVersion(version: string) {
  const choices = ['patch', 'minor', 'major'];
  const confirm = {
    type: 'list',
    name: 'name',
    message: 'Release',
    choices,
  };
  const release = (await inquirer.prompt(confirm)).name;
  return semver.inc(version, release);
}

