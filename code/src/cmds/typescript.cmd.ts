import {
  log,
  constants,
  loadSettings,
  filter,
  inquirer,
  fs,
  fsPath,
  ISettings,
  value as valueUtil,
} from '../common';

type ConfigValue = string | boolean | number;

export const name = 'typescript';
export const alias = 'ts';
export const description = `Common transformations on typescript configuration.`;
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
async function getTsconfigPaths(
  settings: ISettings,
  options: { includeIgnored?: boolean },
) {
  const { includeIgnored = false } = options;
  const paths = settings.modules
    .filter(pkg => filter.includeIgnored(pkg, includeIgnored))
    .map(m => m.dir)
    .map(dir => fsPath.join(dir, 'tsconfig.json'));
  return filter.fileExists(paths);
}

async function saveChangesWithPrompt(
  paths: string[],
  changes: { [key: string]: ConfigValue },
) {
  if (paths.length === 0) {
    log.info.gray('No files to change.');
    return false;
  }

  // List files.
  log.info.cyan(`\nChange files:`);
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
      log.info.gray(`Nothing changed.`);
      return false;

    case 'yes':
      await saveChanges(paths, changes);
      return true;

    default:
      return false;
  }
}

async function saveChanges(
  paths: string[],
  changes: { [key: string]: ConfigValue },
) {
  const saveChange = async (path: string) => {
    const json = await fs.readJsonAsync(path);
    const compilerOptions = { ...json.compilerOptions, ...changes };
    const tsConfig = { ...json, compilerOptions };
    const text = `${JSON.stringify(tsConfig, null, '  ')}\n`;
    await fs.writeFileAsync(path, text);
  };
  const wait = paths.map(path => saveChange(path));
  await Promise.all(wait);
}

function toChoiceParts(choice: string) {
  const parts = choice.split(':');
  const key = parts[0].trim();
  const value = valueUtil.toType(parts[1].trim()) as ConfigValue;
  return { key, value };
}
