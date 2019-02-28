import { parse } from 'path';

import {
  constants,
  filter,
  flatten,
  inquirer,
  listr,
  loadSettings,
  log,
  tryDelete,
} from '../common';

export const name = 'delete';
export const alias = 'del';
export const description = `Deletes transient files across projects (such as logs, yarn.lock, node_modules etc).`;
export const args = {
  '-i': 'Include ignored modules.',
};

export async function cmd(args?: {
  params: string[];
  options: {
    i?: boolean;
  };
}) {
  const options = (args && args.options) || {};
  const includeIgnored = options.i || false;

  // Retrieve modules.
  const settings = await loadSettings();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }

  const response = (await inquirer.prompt<any>([
    {
      type: 'list',
      name: 'type',
      message: 'Delete?',
      choices: ['logs', 'yarn.lock', 'package-lock.json', 'node_modules'],
    },
  ])) as { type: string };
  log.info();

  // Retrieve the list of module directories.
  const modules = settings.modules
    .filter(pkg => filter.includeIgnored(pkg, includeIgnored))
    .map(m => m.dir);

  // Delete each
  switch (response.type) {
    case 'yarn.lock':
      await deleteAfterPrompt(modules.map(dir => `${dir}/yarn.lock`));
      break;

    case 'package-lock.json':
      await deleteAfterPrompt(modules.map(dir => `${dir}/package-lock.json`));
      break;

    case 'logs':
      await deleteAfterPrompt(
        flatten([
          modules.map(dir => `${dir}/yarn-error.log`),
          modules.map(dir => `${dir}/npm-debug.log`),
        ]),
      );
      break;

    case 'node_modules':
      await deleteAfterPrompt(modules.map(dir => `${dir}/node_modules`));
      break;

    default:
      log.error(`'${response.type}' not supported.`);
      break;
  }

  log.info();
}

/**
 * INTERNAL
 */
async function deleteAfterPrompt(paths: string[]) {
  // Ensure all the paths exist.
  paths = await filter.fileExists(paths);
  if (paths.length === 0) {
    log.info.gray('No files to delete.');
    return false;
  }

  // List files.
  log.info.cyan(`\nDelete files:`);
  paths.forEach(path => {
    log.info(` ${toDisplayPath(path)}`);
  });
  log.info();

  // Prompt user.
  const response = (await inquirer.prompt<any>([
    {
      type: 'list',
      name: 'confirm',
      message: 'Are you sure?',
      choices: ['No', 'Yes'],
    },
  ])) as { confirm: string };

  // Perform operation.
  switch (response.confirm) {
    case 'No':
      log.info.gray(`Nothing deleted.`);
      return false;

    case 'Yes':
      log.info();
      await deleteFiles(paths);
      return true;

    default:
      return false;
  }
}

function toDisplayPath(path: string) {
  const root = parse(path);
  const dir = parse(root.dir);
  return log.gray(`${dir.dir}/${log.magenta(dir.base)}/${log.cyan(root.base)}`);
}

async function deleteFiles(paths: string[]) {
  const tasks = paths.map(path => {
    return {
      title: `${log.cyan('Delete')} ${toDisplayPath(path)}`,
      task: async () => tryDelete(path, { retry: 3 }),
    };
  });
  try {
    await listr(tasks, { concurrent: true, exitOnError: false }).run();
  } catch (error) {
    // Ignore.
  }
}
