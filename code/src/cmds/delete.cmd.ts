import {
  log,
  constants,
  loadSettings,
  filter,
  inquirer,
  fs,
  flatten,
  fsPath,
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
      choices: ['logs', 'yarn.lock', 'node_modules'],
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
  paths = await filterExists(paths);
  if (paths.length === 0) {
    log.info.gray('No files to delete.');
    return false;
  }

  // List files.
  log.info.cyan(`\nDelete files:`);
  paths.forEach(path => {
    const parts = fsPath.parse(path);
    log.info.gray(` ${parts.dir}/${log.cyan(parts.base)}`);
  });
  log.info();

  // Prompt user.
  const response = (await inquirer.prompt<any>([
    {
      type: 'list',
      name: 'confirm',
      message: 'Are you sure?',
      choices: ['no', 'yes'],
    },
  ])) as { confirm: string };

  // Perform operation.
  switch (response.confirm) {
    case 'no':
      log.info.gray(`Nothing deleted.`);
      return false;

    case 'yes':
      await deleteFiles(paths);
      return true;

    default:
      return false;
  }
}

async function deleteFiles(paths: string[]) {
  for (const path of paths) {
    await fs.removeAsync(path);
    log.info.magenta(`Deleted ${log.gray(path)}`);
  }
}

async function filterExists(paths: string[]) {
  const checking = paths.map(async path => {
    const exists = await fs.existsAsync(path);
    return { path, exists };
  });
  const results = await Promise.all(checking);
  return results.filter(result => result.exists).map(result => result.path);
}
