import {
  log,
  constants,
  loadSettings,
  filter,
  inquirer,
  fs,
  ISettings,
  value as valueUtil,
  listr,
} from '../common';
import { parse } from 'path';

type ConfigValue = string | boolean | number;

export const name = 'tsconfig';
export const alias = 'ts';
export const description = `Common transformations across typescript configuration files.`;
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
      message: 'Change?',
      choices: ['noUnusedLocals: true', 'noUnusedLocals: false'],
    },
  ])) as { type: string };
  log.info();

  // Retrieve the list of module directories.
  const paths = await getTsconfigPaths(settings, { includeIgnored });
  const parts = toChoiceParts(response.type);

  // Perform change.
  switch (response.type) {
    case 'noUnusedLocals: true':
    case 'noUnusedLocals: false':
      await saveChangesWithPrompt(paths, { noUnusedLocals: parts.value });
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
async function getTsconfigPaths(settings: ISettings, options: { includeIgnored?: boolean }) {
  const { includeIgnored = false } = options;
  const paths = settings.modules
    .filter(pkg => filter.includeIgnored(pkg, includeIgnored))
    .map(m => m.dir)
    .map(dir => fs.join(dir, 'tsconfig.json'));
  return filter.fileExists(paths);
}

async function saveChangesWithPrompt(paths: string[], changes: { [key: string]: ConfigValue }) {
  if (paths.length === 0) {
    log.info.gray('No files to change.');
    return false;
  }

  // List files.
  log.info.cyan(`\nChange files:`);
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
      log.info.gray(`Nothing changed.`);
      return false;

    case 'Yes':
      await saveChanges(paths, changes);
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

async function saveChanges(paths: string[], changes: { [key: string]: ConfigValue }) {
  const saveChange = async (path: string) => {
    const json = await fs.readJson(path);
    const compilerOptions = { ...json.compilerOptions, ...changes };
    const tsConfig = { ...json, compilerOptions };
    const text = `${JSON.stringify(tsConfig, null, '  ')}\n`;
    await fs.writeFile(path, text);
  };

  const tasks = paths.map(path => {
    return {
      title: `${log.cyan('Updated')} ${toDisplayPath(path)}`,
      task: async () => saveChange(path),
    };
  });
  try {
    await listr(tasks, { concurrent: true, exitOnError: false }).run();
  } catch (error) {
    // Ignore.
  }
}

function toChoiceParts(choice: string) {
  const parts = choice.split(':');
  const key = parts[0].trim();
  const value = valueUtil.toType(parts[1].trim()) as ConfigValue;
  return { key, value };
}
