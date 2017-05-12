import {
  log,
  loadSettings,
  exec,
  listr,
  IListrOptions,
  constants,
  IModule,
  elapsed,
  inquirer,
  semver,
} from '../common';
import { printTable } from './ls.cmd';

export const name = 'publish';
export const alias = 'p';
export const description = 'Publishes all modules that are ahead of NPM.';
export const args = {
};


/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {
    },
  },
) {
  // const options = (args && args.options) || {};
  await publish({});
}


export interface IOptions { }


export async function publish(options: IOptions = {}) {
  // Retrieve settings.
  const settings = await loadSettings({ npm: true, spinner: true });
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }

  // Filter on modules that require publishing.
  const modules = settings
    .modules
    .filter((pkg) => isPublishRequired(pkg));
  printTable(modules);

  if (modules.length === 0) {
    log.info.gray(`No modules need publishing.\n`);
    return;
  }

  // Ensure each module can be published.
  log.info.gray(`Running pre-flight checks:\n`);
  const preflightCommand = (pkg: IModule) => pkg.hasPrepublish ? 'yarn run prepublish' : 'echo no-prepublish';
  const preflightPassed = await runCommand(modules, preflightCommand, { concurrent: true, exitOnError: false });
  if (!preflightPassed) {
    log.info.yellow(`\nSome preflight checks failed, nothing was published.\n`);
    return;
  }

  // Prompt the user if they want to continue.
  log.info.gray(`\nAll modules are good to go!\n`);
  if (!(await promptYesNo('Publish to NPM now?'))) {
    log.info();
    return;
  }

  // Publish.
  log.info.gray(`Publishing to NPM:\n`);
  const startedAt = new Date();
  const publishCommand = () => 'npm publish';
  const publishedSuccessfully = await runCommand(modules, publishCommand);
  if (publishedSuccessfully) {
    log.info(`\n✨✨  Done ${log.gray(elapsed(startedAt))}\n`);
  } else {
    log.info.yellow(`\n💩  Something went wrong while publishing.\n`);
  }
}



const runCommand = async (modules: IModule[], cmd: (pkg: IModule) => string, options: IListrOptions = {}) => {
  const prepublish = (pkg: IModule) => {
    return {
      title: `${log.cyan(pkg.name)} ${log.magenta(cmd(pkg))}`,
      task: async () => {
        const command = `cd ${pkg.dir} && ${cmd(pkg)}`;
        return await exec.run(command, { silent: true });
      },
    };
  };
  const tasks = modules.map((pkg) => prepublish(pkg));
  const runner = listr(tasks, { concurrent: true, exitOnError: false });
  try {
    await runner.run();
    return true;
  } catch (error) {
    return false; // Fail.
  }
};




async function promptYesNo(message: string) {
  const confirm = {
    type: 'list',
    name: 'answer',
    message,
    choices: [
      { name: 'Yes', value: 'true' },
      { name: 'No', value: 'false' },
    ],
  };
  const answer = (await inquirer.prompt(confirm)).answer;
  return answer === 'true' ? true : false;
}



const isPublishRequired = (pkg: IModule) =>
  pkg.npm
    ? semver.gt(pkg.version, pkg.npm.latest)
    : false;
