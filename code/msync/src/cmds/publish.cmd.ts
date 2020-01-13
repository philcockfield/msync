import {
  constants,
  elapsed,
  exec,
  IModule,
  inquirer,
  listr,
  loadSettings,
  log,
  plural,
  semver,
  formatModuleName,
} from '../common';
import { printTable } from './ls.cmd';

export const name = 'publish';
export const alias = ['p', 'pub'];
export const description = 'Publishes all modules that are ahead of NPM.';
export const args = {};

/**
 * CLI command.
 */
export async function cmd(args?: { params: string[]; options: {} }) {
  await publish({});
}

export async function publish(options: {} = {}) {
  // Retrieve settings.
  const settings = await loadSettings({ npm: true, spinner: true });
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }

  // Filter on modules that require publishing.
  const modules = settings.modules.filter(pkg => isPublishRequired(pkg));
  printTable(modules);

  const total = modules.length;
  if (total === 0) {
    log.info.gray(`✨✨  No modules need to be published.\n`);
    return;
  }

  // Prompt the user if they want to continue.
  log.info();
  if (!(await promptYesNo(`Publish ${total} ${plural('module', total)} to NPM now?`))) {
    log.info();
    return;
  }

  // Publish.
  log.info.gray(`Publishing to NPM:\n`);
  const startedAt = new Date();

  // [Slow] Full install and sync mode.
  const publishCommand = (pkg: IModule) => {
    const install = pkg.engine === 'YARN' ? 'yarn install' : 'npm install';
    // return `${install} && npm publish && msync sync`;
    return `${install} && npm publish`;
  };

  let current: IModule | undefined;
  const publishResult = await runCommand(modules, publishCommand, {
    concurrent: false,
    exitOnError: true,
    onStart: pkg => (current = pkg),
  });

  if (publishResult.success) {
    log.info(`\n✨✨  Done ${log.gray(elapsed(startedAt))}\n`);
  } else {
    log.info();
    log.info.yellow(`Failed on module:`);
    log.info.gray(`  ${formatModuleName(current?.name || 'UNKNOWN')}`);
    log.info();
    log.error(publishResult.error);
  }
}

const runCommand = async (
  modules: IModule[],
  cmd: (pkg: IModule) => string,
  options: { concurrent: boolean; exitOnError: boolean; onStart: (pkg: IModule) => void },
) => {
  const { concurrent, exitOnError } = options;
  let errors: Array<{ pkg: IModule; info: string[]; errors: string[] }> = [];

  const task = (pkg: IModule) => {
    return {
      title: `${formatModuleName(pkg.name)} ${log.gray(cmd(pkg))}`,
      task: async () => {
        options.onStart(pkg);
        const command = `cd ${pkg.dir} && ${cmd(pkg)}`;
        const res = await exec.cmd.run(command, { silent: true });
        if (res.error) {
          errors = [...errors, { pkg, info: res.info, errors: res.errors }];
          throw res.error;
        }
        return res;
      },
    };
  };
  const tasks = modules.map(pkg => task(pkg));
  const runner = listr(tasks, { concurrent, exitOnError });
  try {
    await runner.run();
    return { success: true, error: null };
  } catch (error) {
    errors.forEach(({ info }) => {
      info.forEach(line => log.info(line));
    });
    return { success: false, error }; // Fail.
  }
};

async function promptYesNo(message: string) {
  const res = (await inquirer.prompt({
    type: 'list',
    name: 'answer',
    message,
    choices: [
      { name: 'yes', value: 'true' },
      { name: 'no', value: 'false' },
    ],
  })) as { answer: string };
  const answer = res.answer;
  return answer === 'true' ? true : false;
}

const isPublishRequired = (pkg: IModule) =>
  pkg.npm ? semver.gt(pkg.version, pkg.npm.latest) : false;
