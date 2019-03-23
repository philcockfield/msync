import { debounceTime, filter } from 'rxjs/operators';
import { exec, constants, copy, dependsOn, elapsed, file, filter as filterUtil, fs, listr, loadSettings, log, moment, updatePackageRef, util, } from '../common';
import * as listCommand from './ls.cmd';
export const name = 'sync';
export const alias = ['s', 'sl'];
export const description = `Syncs each module's dependency tree within the workspace.`;
export const args = {
    '-i': 'Include ignored modules.',
    '-w': 'Sync on changes to files.',
    '-v': 'Update version reference in package.json files.',
};
export async function cmd(args) {
    const options = (args && args.options) || {};
    const watch = options.w || false;
    const includeIgnored = options.i || false;
    const updateVersions = options.v || false;
    const config = { includeIgnored, updateVersions };
    if (watch) {
        await syncWatch(config);
    }
    else {
        await sync(config);
    }
}
export async function sync(options = {}) {
    const { includeIgnored = false } = options;
    const write = (msg) => util.write(msg, options.silent);
    const settings = await loadSettings();
    if (!settings) {
        write(log.yellow(constants.CONFIG_NOT_FOUND_ERROR));
        return;
    }
    const modules = settings.modules
        .filter(pkg => filterUtil.localDeps(pkg).length > 0)
        .filter(pkg => filterUtil.includeIgnored(pkg, includeIgnored));
    await syncModules(modules, options);
    return {
        settings: settings,
        modules,
    };
}
export async function syncModules(modules, options = {}) {
    const startedAt = new Date();
    const { includeIgnored = false, updateVersions = false, silent = false } = options;
    const write = (msg) => util.write(msg, options.silent);
    const sync = async (sources, target) => {
        for (const source of sources) {
            if (source.package) {
                await copy.module(source.package, target);
                await copy.logUpdate(target);
                await chmod(target);
                if (updateVersions) {
                    await updatePackageRef(target, source.package.name, source.package.version, {
                        save: true,
                    });
                }
            }
        }
    };
    const tasks = modules.map(target => {
        const sources = filterUtil
            .localDeps(target)
            .filter(dep => filterUtil.includeIgnored(dep.package, includeIgnored));
        const sourceNames = sources.map(dep => ` ${log.cyan(dep.name)}`);
        const title = `${log.magenta(target.name)} ${log.cyan(sourceNames.length > 0 ? '⬅' : '')}${sourceNames}`;
        return {
            title,
            task: () => sync(sources, target),
        };
    });
    try {
        if (silent) {
            for (const item of tasks) {
                await item.task();
            }
        }
        else {
            const taskList = listr(tasks, { concurrent: false });
            await taskList.run();
            write(log.gray(` ${elapsed(startedAt)}, ${moment().format('h:mm:ssa')}`));
            write('');
        }
    }
    catch (error) {
        write(log.yellow(`\nFailed while syncing module '${error.message}'.`));
    }
    return modules;
}
export async function chmod(module) {
    const dir = fs.join(module.dir, 'node_modules/.bin');
    if (!(await fs.pathExistsSync(dir))) {
        return [];
    }
    const cmd = exec.command(`chmod 777`);
    const files = (await fs.readdir(dir)).map(name => fs.join(dir, name));
    const wait = files.map(path => {
        return cmd
            .clone()
            .add(path)
            .run({ silent: true });
    });
    await Promise.all(wait);
    return files;
}
export async function syncWatch(options = {}) {
    const { includeIgnored = false, silent = false } = options;
    const write = (msg) => util.write(msg, options.silent);
    write(log.magenta('\nSync watching:'));
    const result = await listCommand.ls({
        dependencies: 'local',
        includeIgnored,
    });
    if (!result) {
        return;
    }
    const { modules, settings } = result;
    modules.forEach(pkg => watch(pkg, modules, settings.watchPattern, includeIgnored, silent));
}
function watch(pkg, modules, watchPattern, includeIgnored, silent) {
    const sync = () => {
        const dependants = dependsOn(pkg, modules);
        if (dependants.length > 0) {
            util.write(log.green(`${pkg.name} changed: `), silent);
            syncModules(dependants, { includeIgnored });
        }
    };
    file
        .watch(fs.join(pkg.dir, watchPattern))
        .pipe(filter(path => !path.includes('node_modules/')), debounceTime(1000))
        .subscribe(() => sync());
}
