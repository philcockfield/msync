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

export const name = 'bump';
export const description = 'dependant';
export const args = {
  '-i': 'Include ignored modules.',
  '-n': 'Retrieve registry details from NPM.',
  '-d': 'Dry run where no files are saved.',
};

export type ReleaseType = 'major' | 'minor' | 'patch';


/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {
      i?: boolean;
      n?: boolean;
      d?: boolean;
    },
  },
) {
  const options = (args && args.options) || {};
  await bump({
    includeIgnored: options.i || false,
    npm: options.n || false,
    dryRun: options.d || false,
  });
}



export interface IOptions {
  includeIgnored?: boolean;
  npm?: boolean;
  dryRun?: boolean;
}



/**
 * Bumps a module version and all references to it in dependant modules.
 */
export async function bump(options: IOptions = {}) {
  const { includeIgnored = false, npm = false, dryRun = false } = options;
  const save = !dryRun;
  const settings = await loadSettings({ npm, spinner: npm });
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

  // Retrieve the dependant modules and list them in a table.
  const dependants = dependsOn(module, modules);
  listCommand.printTable([module], { includeIgnored: true, dependants });
  if (dryRun) {
    log.info.gray(`Dry run...no files will be saved.\n`);
  }

  // Get the version number.
  const release = await promptForReleaseType(module.version);
  if (!release) { return; }

  // Update the selected module and all dependant modules.
  log.info();
  await bumpModule(release, module, modules, 0, undefined, save);
  if (dryRun) {
    log.info.gray(`\nNo files were saved.`);
  } else {
    log.info();
  }
}



async function bumpModule(
  release: ReleaseType,
  pkg: IModule,
  allModules: IModule[],
  level: number,
  ref: { name: string, version: string } | undefined,
  save: boolean,
) {
  // Setup initial conditions.
  const dependants = dependsOn(pkg, allModules);
  const version = semver.inc(pkg.latest, release);
  const isRoot = level === 0;

  // Log output.
  const indent = '  ';
  const bar = isRoot ? '' : '├─';
  const prefix = log.gray(`${indent}${bar}`);

  let msg = '';
  msg += `${prefix}${release.toUpperCase()} `;
  msg += `update ${log.magenta(pkg.name)} to version ${log.magenta(version)} `;
  if (ref) {
    msg += log.yellow(`⬅ ${ref.name} (${ref.version})`);
  }
  log.info.cyan(msg);

  // Update the selected module.
  const json = R.clone<any>(pkg.json);
  json.version = version;
  if (save) {
    await savePackage(pkg.dir, json);
  }

  // Update all dependant modules.
  if (isRoot && dependants.length > 0) {
    log.info.gray('\nDependant modules:');
  }
  for (const dependentPkg of dependants) {
    await updatePackageRef(dependentPkg, pkg.name, version, { save });
    await bumpModule(
      'patch',
      dependentPkg,
      allModules,
      level + 1,
      { name: pkg.name, version },
      save,
    );
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

