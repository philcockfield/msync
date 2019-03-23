import { constants, exec, filter, listr, loadSettings, log, value as valueUtil, } from '../common';
import * as listCommand from './ls.cmd';
export const name = 'run';
export const alias = 'r';
export const description = 'Runs the given command on all modules.';
export const args = {
    '<command>': 'The shell command to invoke.',
    '-i': 'Include ignored modules.',
    '-c': 'Run command concurrently against all modules.  (Default: false).',
};
export async function cmd(args) {
    const cmd = (args && args.params && args.params.join(' ')) || '';
    const options = (args && args.options) || {};
    const includeIgnored = options.i || false;
    const concurrent = options.c || false;
    await run(cmd, { includeIgnored, concurrent });
}
export async function run(cmd, options = {}) {
    const { includeIgnored = false, concurrent = false } = options;
    if (!cmd) {
        log.info.red(`No command specified.\n`);
        return;
    }
    const settings = await loadSettings();
    if (!settings) {
        log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
        return;
    }
    const modules = options.modules || settings.modules.filter(pkg => filter.includeIgnored(pkg, includeIgnored));
    if (valueUtil.defaultValue(options.printStatus, true)) {
        log.info.magenta(`\nRun ${log.cyan(cmd)} on:`);
        listCommand.printTable(modules, { showPath: true });
        log.info();
    }
    const tasks = modules.map(pkg => {
        return {
            title: `${log.cyan(pkg.name)} ${log.magenta(cmd)}`,
            task: async () => {
                const command = `cd ${pkg.dir} && ${cmd}`;
                return exec.cmd.run(command, { silent: true });
            },
        };
    });
    const runner = listr(tasks, { concurrent, exitOnError: false });
    try {
        await runner.run();
    }
    catch (error) {
    }
    log.info();
}
