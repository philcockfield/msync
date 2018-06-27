import {
  log,
  loadSettings,
  constants,
  filter,
  IModule,
  listr,
  elapsed,
  fs,
  fsPath,
  exec,
  table,
} from '../common';
import * as listCommand from './ls.cmd';
import * as syncCommand from './sync.cmd';

export const name = 'build';
export const description = 'Builds and syncs all typescript modules in order.';
export const args = {
  '-i': 'Include ignored modules.',
  '-w': 'Sync on changes to files.',
};

/**
 * CLI command.
 */
export async function cmd(args?: {
  params: string[];
  options: {
    i?: boolean;
    w?: boolean;
  };
}) {
  const options = (args && args.options) || {};
  const watch = options.w || false;
  const includeIgnored = options.i || false;
  await build({ includeIgnored, watch });
}

export interface IOptions {
  includeIgnored?: boolean;
  watch?: boolean;
}

/**
 * Builds all typescript modules.
 */
export async function build(options: IOptions = {}) {
  const { includeIgnored = false, watch = false } = options;
  const settings = await loadSettings();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings.modules
    .filter(pkg => filter.includeIgnored(pkg, includeIgnored))
    .filter(pkg => pkg.isTypeScript);

  if (watch) {
    return buildWatch(modules, includeIgnored);
  } else {
    return buildOnce(modules);
  }
}

const tscCommand = async (pkg: IModule) => {
  const path = fsPath.join(pkg.dir, 'node_modules/typescript/bin/tsc');
  return (await fs.existsAsync(path)) ? path : 'tsc';
};

/**
 * Builds the typescript for the given set of modules.
 */
export async function buildOnce(modules: IModule[]) {
  const startedAt = new Date();
  const tasks = modules.map(pkg => {
    return {
      title: `${log.magenta(pkg.name)} ${log.gray('=> sync')}`,
      task: async () => {
        const tsc = await tscCommand(pkg);
        const cmd = `cd ${pkg.dir} && ${tsc}`;
        await exec.run(cmd, { silent: true });
        await syncCommand.sync({
          includeIgnored: false,
          updateVersions: false,
          silent: true,
        });
      },
    };
  });

  try {
    const taskList = listr(tasks, { concurrent: false, exitOnError: false });
    await taskList.run();
    log.info.gray('', elapsed(startedAt));
    log.info();
  } catch (error) {
    // Ignore.  The failure is obvious in the `listr` output.
  }
}

/**
 * Builds watches the typescript for the given set of modules.
 */
export async function buildWatch(modules: IModule[], includeIgnored: boolean) {
  log.info.magenta('\nBuild watching:');
  listCommand.printTable(modules, { includeIgnored });
  log.info();

  const state: { [key: string]: number } = {};

  modules.forEach(async pkg => {
    const tsc = await tscCommand(pkg);
    const cmd = `cd ${pkg.dir} && ${tsc} --watch`;
    exec.run$(cmd).subscribe(data => {
      let text = data.text;
      const isWatching = text.includes('Watching for file changes.');
      const isCompiling =
        text.includes('Starting compilation in watch') ||
        text.includes('Starting incremental compilation');
      const isError =
        text.includes('error') && !text.includes('Found 0 errors.');

      // Clean up text output from TS compiler:
      //    - Remove trailing new-lines.
      text = text.replace(/\n*$/, '');

      if (isCompiling) {
        const key = pkg.name;
        const count = state[key] === undefined ? 1 : state[key] + 1;
        state[key] = count;
      }

      if (isError && !isWatching) {
        log.clear();
        table()
          .add([log.yellow(pkg.name), formatError(text)])
          .log();
      }

      if (!isError && !isWatching) {
        log.clear();
        const keys = Object.keys(state).sort();
        keys.forEach(key => {
          text = log.gray(`Build (${state[key]})`);
          log.info(`${log.cyan(pkg.name)} ${text}`);
        });
      }
    });
  });
}

const formatError = (error: string) => {
  const MAX = 80;
  const lines = [] as string[];
  error.split('\n').forEach(line => {
    line = line.length <= MAX ? line : splitLines(line);
    lines.push(line);
  });
  return lines.join('\n');
};

const splitLines = (line: string) => {
  const MAX = 80;
  const words = [] as string[];
  let count = 0;
  line.split('').forEach(word => {
    count += word.length;
    if (count > MAX) {
      word = `${word}\n`;
      count = 0;
    }
    words.push(word);
  });
  return words.join('');
};
