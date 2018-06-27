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
  Subject,
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

  const state: {
    [key: string]: {
      count: number;
      error?: string;
      message?: string;
    };
  } = {};

  const updates$ = new Subject();
  updates$.debounceTime(100).subscribe(() => {
    log.clear();
    const items = Object.keys(state)
      .sort()
      .map(key => ({ key, value: state[key] }));

    // Print build summary.
    items.forEach(({ key, value }) => {
      const text = value.error
        ? `${log.red('✘')} ${value.error}`
        : value.message;
      log.info(`${log.cyan(key)} ${text}`);
    });

    // Print errors.
    const errors = items.filter(item => Boolean(item.value.error));
    if (errors.length > 0) {
      log.info();
      errors.forEach(({ key, value }) => {
        log
          .table()
          .add([log.yellow(key), formatError(value.error as string)])
          .log();
      });
    }
  });

  modules.forEach(async pkg => {
    const tsc = await tscCommand(pkg);
    const cmd = `cd ${pkg.dir} && ${tsc} --watch`;
    exec.run$(cmd).subscribe(data => {
      let text = data.text;
      const isCompiling =
        text.includes('Starting compilation in watch') ||
        text.includes('Starting incremental compilation');
      const isError =
        text.includes('error') && !text.includes('Found 0 errors.');

      // Clean up text output from TS compiler:
      //    - Remove trailing new-lines.
      text = text.replace(/\n*$/, '');

      const key = pkg.name;
      const obj = state[key] || { count: 0 };

      if (isCompiling) {
        const count = obj.count + 1;
        const message = log.gray(`Build (${log.magenta(count)})`);
        state[key] = { ...obj, count, message };
      }
      if (isError) {
        obj.error = text;
        obj.message = log.warn('Error');
      }
      if (!isError) {
        delete obj.error;
      }

      updates$.next();
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
