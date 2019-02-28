import { log, loadSettings, constants, filter, listr, exec, util, IModule } from '../common';

interface IOutdated {
  name: string;
  error?: string;
  modules: IOutdatedModule[];
}
interface IOutdatedModule {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  location: string;
}

export const name = 'outdated';
export const alias = 'o';
export const description = 'Checks all modules for outdated references on NPM.';

/**
 * CLI command.
 */
export async function cmd(args?: { params: string[]; options: {} }) {
  outdated({});
}

/**
 * Runs the outdated command on all modules
 */
export async function outdated(options: { includeIgnored?: boolean }) {
  const { includeIgnored = false } = options;

  // Retrieve modules.
  const settings = await loadSettings();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings.modules.filter(pkg => filter.includeIgnored(pkg, includeIgnored));

  // Print status:
  log.info.magenta(`\nChecking for outdated modules:`);

  // const results: { [key: string]: IOutdated } = {};
  const results: IOutdated[] = [];
  const tasks = modules.map(pkg => {
    return {
      title: `${log.cyan(pkg.name)}`,
      task: async () => {
        const result = await getOutdated(pkg);
        if (result.modules.length > 0) {
          results.push(result);
        }
      },
    };
  });

  const runner = listr(tasks, { concurrent: true, exitOnError: false });
  try {
    await runner.run();
  } catch (error) {
    // Ignore.
  }

  // Print outdated modules.
  if (results.length > 0) {
    log.info();
    results.forEach(item => printOutdatedModule(item));
  } else {
    log.info();
    log.info.gray(`All modules up-to-date.`);
  }

  // console.log('results', results);

  log.info();
}

async function getOutdated(pkg: IModule) {
  const result: IOutdated = { name: pkg.name, modules: [] };
  const cmd = `cd ${pkg.dir} && npm outdated`;
  try {
    await exec.run(cmd, { silent: true });
  } catch (error) {
    // NB: Error occurs if there is outdated modules.
    const text = error.message;
    if (hasOutdatedModules(text)) {
      result.modules = parseOutdated(text);
    } else {
      result.error = text; // Some other error occured.
    }
  }
  return result;
}

function hasOutdatedModules(text: string) {
  const titles = ['Package', 'Current', 'Wanted', 'Latest', 'Location'];
  return titles.some(title => text.includes(title));
}

function parseOutdated(text: string): IOutdated['modules'] {
  text = text.substr(text.indexOf('Package'));
  const lines = util.compact(text.split('\n')).slice(1);
  return lines.map(line => {
    const parts = line.replace(/\s+/g, ' ').split(' ');
    const [name, current, wanted, latest, location] = parts;
    return { name, current, wanted, latest, location };
  });
}

function printOutdatedModule(outdated: IOutdated) {
  log.info.yellow(`${outdated.name}`);

  const table = log.table({
    head: ['Package', 'Current', 'Wanted', 'Latest'].map(label => log.gray(label)),
  });

  outdated.modules.forEach(item => {
    const { name, current, wanted, latest } = item;
    table.add([
      name,
      log.gray(current),
      wanted === latest ? log.green(wanted) : log.magenta(wanted),
      log.green(latest),
    ]);
  });

  table.log();
  log.info();
}
