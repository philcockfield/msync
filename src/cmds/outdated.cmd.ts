import {
  constants,
  exec,
  filter,
  IModule,
  listr,
  loadSettings,
  log,
  inquirer,
  semver,
  value as valueUtil,
} from '../common';

type IOutdated = {
  name: string;
  error?: string;
  modules: IOutdatedModule[];
};
type IOutdatedModule = {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  location: string;
};
type IUpdate = {
  name: string;
  latest: string;
  count: number;
};

export const name = 'outdated';
export const alias = 'o';
export const description = 'Checks all modules for outdated references on NPM.';

/**
 * CLI command.
 */
export async function cmd(args?: { params: string[]; options: {} }) {
  outdated({});
}

/**
 * Runs the outdated command on all modules
 */
export async function outdated(options: { includeIgnored?: boolean }) {
  const { includeIgnored = false } = options;

  // Retrieve modules.
  const settings = await loadSettings();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings.modules.filter(pkg => filter.includeIgnored(pkg, includeIgnored));

  // Print status:
  log.info.magenta(`\nChecking for outdated modules:`);

  // const results: { [key: string]: IOutdated } = {};
  const results: IOutdated[] = [];
  const tasks = modules.map(pkg => {
    return {
      title: `${log.cyan(pkg.name)}`,
      task: async () => {
        const result = await getOutdated(pkg);
        if (result.modules.length > 0) {
          results.push(result);
        }
      },
    };
  });

  const runner = listr(tasks, { concurrent: true, exitOnError: false });
  try {
    await runner.run();
  } catch (error) {
    // Ignore.
  }

  // console.log('results', results);

  // Print outdated modules.
  if (results.length > 0) {
    log.info();
    results.forEach(item => printOutdatedModule(item));
    await update(modules, await promptToUpdate(results));
  } else {
    log.info();
    log.info.gray(`All modules up-to-date.`);
  }

  log.info();
}

/**
 * [INTERNAL]
 */
async function promptToUpdate(outdated: IOutdated[]): Promise<IUpdate[]> {
  if (outdated.length === 0) {
    return [];
  }

  // Build a list of all modules that need updating.
  const updates: { [key: string]: IUpdate } = {};
  outdated.forEach(outdated => {
    outdated.modules.forEach(m => {
      const { name, latest } = m;
      const current = updates[name] ? updates[name].latest : undefined;
      if (!current || semver.gt(latest, current)) {
        const count = updates[name] ? updates[name].count + 1 : 1;
        updates[name] = { name, latest, count };
      }
    });
  });

  // Format checkbox choices.
  const choices = Object.keys(updates).map(key => {
    const update = updates[key];
    const modules = valueUtil.plural(update.count, 'module', 'modules');
    const name = `${key} ➜ ${update.latest} (${update.count} ${modules})`;
    return { name, value: update.name };
  });

  // Prompt the user.
  const answer: { update: string[] } = await inquirer.prompt({
    name: 'update',
    type: 'checkbox',
    choices,
  });

  // Finish up.
  return Object.keys(updates)
    .map(key => updates[key])
    .filter(update => answer.update.includes(update.name));
}

export function update(modules: IModule[], updates: IUpdate[]) {
  console.log('update', updates);
  if (updates.length === 0) {
    return;
  }



}

async function getOutdated(pkg: IModule) {
  const result: IOutdated = { name: pkg.name, modules: [] };
  const cmd = `cd ${pkg.dir} && npm outdated --json`;
  try {
    const res = await exec.cmd.run(cmd, { silent: true });
    result.modules = parseOutdated(res.info);
  } catch (error) {
    result.error = error.message; // Some other error occured.
  }
  return result;
}

function parseOutdated(stdout: string[]): IOutdatedModule[] {
  if (!stdout || stdout.length === 0) {
    return [];
  }
  const json = JSON.parse(stdout.join('\n'));
  return Object.keys(json).map(name => {
    const { current, wanted, latest, location } = json[name];
    const outdated: IOutdatedModule = { name, current, wanted, latest, location };
    return outdated;
  });
}

function printOutdatedModule(outdated: IOutdated) {
  log.info.yellow(`${outdated.name}`);

  const table = log.table({
    head: ['Package', 'Current', 'Wanted', 'Latest'].map(label => log.gray(label)),
  });

  outdated.modules.forEach(item => {
    const { name, current, wanted, latest } = item;
    table.add([
      name,
      log.gray(current),
      wanted === latest ? log.green(wanted) : log.magenta(wanted),
      log.green(latest),
    ]);
  });

  table.log();
  log.info();
}
