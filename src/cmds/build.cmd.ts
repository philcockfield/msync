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

export const name = 'build';
export const alias = 'b';
export const description = 'Builds all typescript modules.';
export const args = {
  '-i': 'Include ignored modules.',
  '-w': 'Sync on changes to files.',
};


/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {
      i?: boolean;
      w?: boolean;
    },
  },
) {
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
  const modules = settings
    .modules
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored))
    .filter((pkg) => pkg.isTypeScript);

  if (watch) {
    return await buildWatch(modules, includeIgnored);
  } else {
    return await buildOnce(modules);
  }
}


const tscCommand = async (pkg: IModule) => {
  const path = fsPath.join(pkg.dir, 'node_modules/typescript/bin/tsc');
  return (await fs.existsAsync(path))
    ? path
    : 'tsc';
};



/**
 * Builds the typescript for the given set of modules.
 */
export async function buildOnce(modules: IModule[]) {
  const startedAt = new Date();
  const tasks = modules.map((pkg) => {
    return {
      title: `${log.magenta(pkg.name)}`,
      task: async () => {
        const tsc = await tscCommand(pkg);
        const cmd = `cd ${pkg.dir} && ${tsc}`;
        await exec.run(cmd, { silent: true });
      },
    };
  });

  try {
    const taskList = listr(tasks, { concurrent: true, exitOnError: false });
    await taskList.run();
    log.info.gray('', elapsed(startedAt));
    log.info();

  } catch (error) {
    log.warn(log.yellow(`\nFailed while building typescript. '${error.message}'.`));
  }
}



/**
 * Builds watches the typescript for the given set of modules.
 */
export async function buildWatch(modules: IModule[], includeIgnored: boolean) {
  log.info.magenta('\nBuild watching:');
  listCommand.printTable(modules, { includeIgnored });

  modules.forEach(async (pkg) => {
    const tsc = await tscCommand(pkg);
    const cmd = `cd ${pkg.dir} && ${tsc} --watch`;
    exec
      .run$(cmd)
      .forEach((data) => {
        const isError = data.text.includes('error');

        // Clean up text output from TS compiler:
        // - Remove training new-lines.
        // - Remove date prefix.
        let text = data.text.replace(/\n*$/, '');
        if (!isError) {
          text = text.substring(text.indexOf(' - ') + 3, text.length);
        }

        if (isError) {
          table()
            .add(log.yellow(pkg.name), text)
            .log();
        } else {
          log.info(`${log.cyan(pkg.name)} ${text}`);
        }
      });
  });
}
