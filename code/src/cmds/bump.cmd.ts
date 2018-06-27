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
  ILogTable,
} from '../common';
import * as listCommand from './ls.cmd';

export const name = 'bump';
export const alias = 'b';
export const description =
  'Bumps a module version along with it\'s entire dependency graph.';
export const args = {
  '-i': 'Include ignored modules.',
  '-d': 'Dry run where no files are saved.',
  '-l': 'Local versions only. Does not retrieve NPM details.',
};

export type ReleaseType = 'major' | 'minor' | 'patch';

/**
 * CLI command.
 */
export async function cmd(args?: {
  params: string[];
  options: {
    i?: boolean;
    d?: boolean;
    l?: boolean;
  };
}) {
  const options = (args && args.options) || {};
  await bump({
    includeIgnored: options.i || false,
    local: options.l || false,
    dryRun: options.d || false,
  });
}

export interface IOptions {
  includeIgnored?: boolean;
  local?: boolean;
  dryRun?: boolean;
}

/**
 * Bumps a module version and all references to it in dependant modules.
 */
export async function bump(options: IOptions = {}) {
  const { includeIgnored = false, local = false, dryRun = false } = options;
  const save = !dryRun;
  const npm = !local;
  const settings = await loadSettings({ npm, spinner: npm });
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings.modules.filter(pkg =>
    filter.includeIgnored(pkg, includeIgnored),
  );

  // Prompt for the module to bump.
  const module = await promptForModule(modules);
  if (!module) {
    return;
  }

  // Retrieve the dependant modules and list them in a table.
  const dependants = dependsOn(module, modules);
  listCommand.printTable([module], { includeIgnored: true, dependants });
  if (dryRun) {
    log.info.gray(`Dry run...no files will be saved.\n`);
  }

  // Get the version number.
  const release = (await promptForReleaseType(module.version)) as ReleaseType;
  if (!release) {
    return;
  }

  // Update the selected module and all dependant modules.
  log.info();
  const tableBuilder = await bumpModule({
    release,
    pkg: module,
    allModules: modules,
    save,
  });
  tableBuilder.log();

  if (dryRun) {
    log.info.gray(`\nNo files were saved.`);
  } else {
    log.info();
  }
}

async function bumpModule(options: {
  release: ReleaseType;
  pkg: IModule;
  allModules: IModule[];
  save: boolean;
  level?: number;
  ref?: { name: string; fromVersion: string; toVersion: string };
  table?: ILogTable;
}) {
  // Setup initial conditions.
  const { release, pkg, allModules, save, level = 0, ref } = options;
  const dependants = dependsOn(pkg, allModules);
  const version = semver.inc(pkg.latest, release);
  const isRoot = ref === undefined;

  if (!version) {
    throw new Error(`Failed to '${release}' the semver ${pkg.latest}.`);
  }

  // Log output.
  const head = ['update', 'module', 'version', 'ref updated'].map(title =>
    log.gray(title),
  );
  const tableBuilder = options.table || log.table({ head });

  if (!ref) {
    let msg = '';
    msg += `  ${log.yellow(release.toUpperCase())} `;
    msg += `update ${log.cyan(pkg.name)} from ${log.gray(
      pkg.latest,
    )} ${log.gray('=>')} ${log.magenta(version)} `;
    log.info.gray(msg);
  } else {
    tableBuilder.add([
      log.yellow(release.toUpperCase()),
      log.cyan(pkg.name),
      log.gray(`${pkg.latest} => ${log.magenta(version)}`),
      log.gray(
        `${log.cyan(ref.name)} ${ref.fromVersion} => ${log.magenta(
          ref.toVersion,
        )}`,
      ),
    ]);
  }

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
    await bumpModule({
      release: 'patch',
      pkg: dependentPkg,
      allModules,
      level: level + 1,
      ref: { name: pkg.name, fromVersion: pkg.latest, toVersion: version },
      save,
      table: tableBuilder,
    });
  }
  return tableBuilder;
}

async function promptForModule(modules: IModule[]) {
  const choices = modules.map(pkg => ({ name: pkg.name, value: pkg.name }));
  const confirm = {
    type: 'list',
    name: 'name',
    message: 'Select a module',
    choices,
  };
  const res = (await inquirer.prompt(confirm)) as { name: string };
  const name = res.name;
  return modules.find(pkg => pkg.name === name);
}

async function promptForReleaseType(version: string) {
  const choices = ['patch', 'minor', 'major'];
  const confirm = {
    type: 'list',
    name: 'name',
    message: 'Release',
    choices,
  };
  const res = (await inquirer.prompt(confirm)) as { name: string };
  return res.name;
}
