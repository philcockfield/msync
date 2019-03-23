import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { constants, elapsed, exec, filter as filterUtil, fs, listr, loadSettings, log, } from '../common';
import * as listCommand from './ls.cmd';
import * as syncCommand from './sync.cmd';
export const name = 'build';
export const description = 'Builds and syncs all typescript modules in order.';
export const args = {
    '-i': 'Include ignored modules.',
    '-w': 'Sync on changes to files.',
    '-v': 'Verbose mode. Prints all error details.',
};
export async function cmd(args) {
    const options = (args && args.options) || {};
    const watch = options.w || false;
    const includeIgnored = options.i || false;
    const verbose = options.v || false;
    await build({ includeIgnored, watch, verbose });
}
export async function build(options = {}) {
    const { includeIgnored = false, watch = false, verbose = false } = options;
    const settings = await loadSettings();
    if (!settings) {
        log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
        return;
    }
    const modules = settings.modules
        .filter(pkg => filterUtil.includeIgnored(pkg, includeIgnored))
        .filter(pkg => pkg.isTypeScript);
    if (watch) {
        return buildWatch(modules, includeIgnored, verbose);
    }
    else {
        return buildOnce(modules);
    }
}
const tscCommand = async (pkg) => {
    const path = fs.join(pkg.dir, 'node_modules/typescript/bin/tsc');
    return (await fs.pathExists(path)) ? path : 'tsc';
};
export async function buildOnce(modules) {
    const startedAt = new Date();
    const tasks = modules.map(pkg => {
        return {
            title: `${log.magenta(pkg.name)} ${log.gray('=> sync')}`,
            task: async () => {
                const tsc = await tscCommand(pkg);
                const cmd = `cd ${pkg.dir} && ${tsc}`;
                await exec.cmd.run(cmd, { silent: true });
                await syncCommand.sync({
                    includeIgnored: false,
                    updateVersions: false,
                    silent: true,
                });
            },
        };
    });
    try {
        const taskList = listr(tasks, { concurrent: false, exitOnError: false });
        await taskList.run();
        log.info.gray('', elapsed(startedAt));
        log.info();
    }
    catch (error) {
    }
}
export async function buildWatch(modules, includeIgnored, verbose) {
    log.info.magenta('\nBuild watching:');
    listCommand.printTable(modules, { includeIgnored });
    log.info();
    const state = {};
    const updates$ = new Subject();
    updates$.pipe(debounceTime(100)).subscribe(() => {
        log.clear();
        const items = Object.keys(state)
            .sort()
            .map(key => ({ key, value: state[key] }));
        items.forEach(({ key, value }) => {
            const hasErrors = value.errors.length > 0;
            const bullet = hasErrors ? log.red('✘') : value.isBuilding ? log.gray('✎') : log.green('✔');
            log.info(`${bullet} ${log.cyan(key)} ${value.message}`);
        });
        const errors = items.filter(({ value }) => value.errors.length > 0);
        if (verbose && errors.length > 0) {
            log.info();
            errors.forEach(({ key, value }) => {
                value.errors.forEach(error => {
                    log
                        .table()
                        .add([log.yellow(key), formatError(error)])
                        .log();
                });
            });
        }
    });
    modules.forEach(async (pkg) => {
        const tsc = await tscCommand(pkg);
        const cmd = `cd ${pkg.dir} && ${tsc} --watch`;
        exec.cmd.run(cmd).output$.subscribe(e => {
            let text = e.text;
            const isBuilding = text.includes('Starting compilation in watch') ||
                text.includes('Starting incremental compilation');
            const isError = text.includes('error') && !text.includes('Found 0 errors.');
            const isSuccess = text.includes('Found 0 errors.');
            const isBuilt = text.includes('Watching for file changes.');
            text = text.replace(/\n*$/, '');
            const key = pkg.name;
            let obj = state[key] || { count: 0, errors: [] };
            obj.isBuilding = isBuilding;
            if (isBuilding || isBuilt) {
                const count = isBuilding ? obj.count + 1 : obj.count;
                const status = isBuilding ? 'Building...' : 'Built';
                const countStatus = isBuilding ? log.gray(count) : log.green(count);
                const message = log.gray(`${status} (${countStatus})`);
                obj = Object.assign({}, obj, { count, message });
            }
            if (isError) {
                if (!isBuilt) {
                    obj.errors = [...obj.errors, text];
                }
                const error = obj.errors.length === 1 ? 'Error' : 'Errors';
                obj.message = log.red(`${obj.errors.length} ${error}`);
            }
            if (isSuccess) {
                obj.errors = [];
            }
            state[key] = obj;
            updates$.next();
        });
    });
}
const formatError = (error) => {
    const MAX = 80;
    const lines = [];
    error.split('\n').forEach(line => {
        line = line.length <= MAX ? line : splitLines(line);
        lines.push(line);
    });
    return lines.join('\n');
};
const splitLines = (line) => {
    const MAX = 80;
    const words = [];
    let count = 0;
    line.split('').forEach(word => {
        count += word.length;
        if (count > MAX) {
            word = `${word}\n`;
            count = 0;
        }
        words.push(word);
    });
    return words.join('');
};
