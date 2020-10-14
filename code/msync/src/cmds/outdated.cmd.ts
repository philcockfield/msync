import {
  constants,
  exec,
  filter,
  IModule,
  inquirer,
  listr,
  loadSettings,
  log,
  semver,
  updatePackageRef,
  formatModuleName,
} from '../common';
import { run } from './run.cmd';

type O = Record<string, unknown>;

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
};

export const name = 'outdated';
export const alias = 'o';
export const description = 'Checks all modules for outdated references on NPM.';

/**
 * CLI command.
 */
export async function cmd(args?: { params: string[]; options: O }) {
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
  const modules = settings.modules.filter((pkg) => filter.includeIgnored(pkg, includeIgnored));

  // Print status:
  log.info.gray(`\nChecking for outdated modules:`);

  const results: IOutdated[] = [];

  const tasks = modules.map((pkg) => {
    return {
      title: `${formatModuleName(pkg.name)}`,
      task: async () => {
        const result = await getOutdated(pkg);
        if (result.modules.length > 0 || result.error) {
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

  // Print outdated modules.
  if (results.length > 0) {
    log.info();
    results.forEach((item) => printOutdatedModule(item));

    // Prompt the use for which [package.json] files to update.
    const updated = await updatePackageJsonRefs(modules, await promptToUpdate(results));
    if (updated.length > 0) {
      await run('yarn install', { concurrent: true, modules: updated, printStatus: false });
    }
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
  outdated.forEach((outdated) => {
    outdated.modules.forEach((m) => {
      const { name, latest } = m;
      const current = updates[name] ? updates[name].latest : undefined;
      if (!current || semver.gt(latest, current)) {
        updates[name] = { name, latest: latest };
      }
    });
  });

  // Format checkbox choices.
  const choices = Object.keys(updates).map((key) => {
    const update = updates[key];
    const name = `${key} ➜ ${update.latest}`;
    return { name, value: update.name };
  });

  if (choices.length === 0) {
    return [];
  }

  // Prompt the user.
  const answer: { update: string[] } = await inquirer.prompt({
    name: 'update',
    type: 'checkbox',
    choices,
    pageSize: 30,
  });

  // Finish up.
  return Object.keys(updates)
    .map((key) => updates[key])
    .filter((update) => answer.update.includes(update.name));
}

async function updatePackageJsonRefs(modules: IModule[], updates: IUpdate[]) {
  if (updates.length === 0) {
    return [];
  }

  let updated: IModule[] = [];

  for (const update of updates) {
    await Promise.all(
      modules.map(async (pkg) => {
        const changed = await updatePackageRef(pkg, update.name, update.latest, { save: true });
        if (changed && !updated.some((m) => m.name === pkg.name)) {
          updated = [...updated, pkg];
        }
      }),
    );
  }

  if (updated.length > 0) {
    log.info.gray(`\nUpdated:`);
    updated.forEach((pkg) => {
      log.info.gray(` - ${log.cyan(pkg.name)}`);
    });
    log.info();
  }

  return updated;
}

async function getOutdated(pkg: IModule) {
  const result: IOutdated = { name: pkg.name, modules: [] };
  const cmd = `cd ${pkg.dir} && npm outdated --json`;
  try {
    const res = await exec.cmd.run(cmd, { silent: true });
    const { outdated, error } = parseOutdated(res.info);
    result.modules = outdated;
    result.error = error;
  } catch (error) {
    result.error = error.message; // Some other error occured.
  }
  return result;
}

function parseOutdated(stdout: string[]): { error?: string; outdated: IOutdatedModule[] } {
  if (!stdout || stdout.length === 0) {
    return { outdated: [] };
  }

  const json = JSON.parse(stdout.join('\n'));
  const error = json.error;
  if (error) {
    return { error: error.summary, outdated: [] };
  }

  const outdated = Object.keys(json).map((name) => {
    const { current, wanted, latest, location } = json[name];
    const outdated: IOutdatedModule = { name, current, wanted, latest, location };
    return outdated;
  });

  return { outdated };
}

function printOutdatedModule(outdated: IOutdated) {
  log.info.yellow(`${outdated.name}`);
  if (outdated.error) {
    log.info.red(outdated.error);
  }

  const table = log.table({
    head: [' dependency', 'current ', 'wanted ', 'latest'].map((label) => log.gray(label)),
    border: false,
  });

  outdated.modules.forEach((item) => {
    const { name, current, latest } = item;
    const wanted = item.wanted === latest ? log.green(item.wanted) : log.magenta(item.wanted);
    table.add([
      log.gray(`  • ${formatModuleName(name)}  `),
      `${log.gray(current)}  `,
      `${wanted}  `,
      `${log.green(latest)}`,
    ]);
  });

  if (outdated.modules.length > 0) {
    table.log();
  }

  log.info();
}
