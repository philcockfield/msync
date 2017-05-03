import {
  log,
  loadSettings,
  constants,
  listr,
  table,
  IModule,
  filter,
  exec,
  elapsed,
  semver,
} from '../common';


export const name = 'npm';
export const alias = 'n';
export const description = 'Retrieves latest information from NPM.';
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
  await npm({ includeIgnored });
}


export interface IOptions {
  includeIgnored?: boolean;
}

export interface INpmInfo {
  latest: string;
  json: object;
  module: IModule;
}


/**
 * Reads module information from NPM.
 */
export async function npm(options: IOptions = {}) {
  const { includeIgnored = false } = options;
  const startedAt = new Date();
  const settings = await loadSettings();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }

  const modules = settings
    .modules
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored))
    .filter((pkg) => pkg.isTypeScript);

  const results = {} as { [key: string]: INpmInfo };
  const tasks = modules.map((pkg) => {
    return {
      title: log.cyan(pkg.name),
      task: async () => {
        const info = await npmInfo(pkg);
        results[pkg.name] = info;
      },
    };
  });

  try {
    const taskList = listr(tasks, { concurrent: true, exitOnError: false });
    await taskList.run();
    log.info.gray('', elapsed(startedAt));
    log.info();
  } catch (error) {
    // Ignore.  The failure is obvious in the `listr` output.
  }

  const builder = table({ head: ['module', 'version', 'latest'] });

  modules.forEach((pkg) => {
    const item = results[pkg.name];
    const localVersion = item.module.version;
    const publishRequired = semver.gt(localVersion, item.latest);
    const localVersionDisplay = publishRequired
      ? log.yellow(localVersion)
      : log.magenta(localVersion);
    const remoteVersion = publishRequired
      ? log.gray(item.latest)
      : log.magenta(item.latest);

    builder.add([
      log.cyan(item.module.name),
      localVersionDisplay,
      remoteVersion,
    ]);
  });
  builder.log();
}



async function npmInfo(pkg: IModule): INpmInfo {
  const cmd = `yarn info ${pkg.name} --json`;
  const result = await exec.run(cmd, { silent: true });
  const json = JSON.parse(result.stdout);
  const latest = json.data['dist-tags'].latest;
  return {
    latest,
    json,
    module: pkg,
  };
}
