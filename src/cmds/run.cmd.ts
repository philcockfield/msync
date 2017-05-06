import {
  log,
  loadSettings,
  constants,
  filter,
  listr,
  exec,
} from '../common';
import * as listCommand from './ls.cmd';


export const name = 'run';
export const alias = 'r';
export const description = 'Runs the given command on all modules.';
export const args = {
  '<command>': 'The shell command to invoke.',
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

  const cmd = (args && args.params && args.params.join(' ')) || '';
  const options = (args && args.options) || {};

  const includeIgnored = options.i || false;
  await run(cmd, { includeIgnored });
}




export interface IOptions {
  includeIgnored?: boolean;
}


/**
 * Runs the given command on all modules.
 */
export async function run(cmd: string, options: IOptions = {}) {
  const { includeIgnored = false } = options;
  if (!cmd) {
    log.info.red(`No command specified.\n`);
    return;
  }

  // Retrieve modules.
  const settings = await loadSettings();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings
    .modules
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored));

  // Print status:
  log.info.magenta(`\nRun ${log.cyan(cmd)} on:`);
  listCommand.printTable(modules, { showPath: true });
  log.info();

  // Run tasks.
  const tasks = modules.map((pkg) => {
    return {
      title: `${log.cyan(pkg.name)} ${log.magenta(cmd)}`,
      task: async () => {
        const command = `cd ${pkg.dir} && ${cmd}`;
        return await exec.run(command, { silent: true });
      },
    };
  });
  const runner = listr(tasks, { concurrent: true, exitOnError: false });
  try {
    await runner.run();
  } catch (error) {
    // Ignore.
  }
  log.info();
}
