import { constants, exec, filter, inquirer, listr, loadSettings, log, semver, updatePackageRef, } from '../common';
import { run } from './run.cmd';
export const name = 'outdated';
export const alias = 'o';
export const description = 'Checks all modules for outdated references on NPM.';
export async function cmd(args) {
    outdated({});
}
export async function outdated(options) {
    const { includeIgnored = false } = options;
    const settings = await loadSettings();
    if (!settings) {
        log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
        return;
    }
    const modules = settings.modules.filter(pkg => filter.includeIgnored(pkg, includeIgnored));
    log.info.magenta(`\nChecking for outdated modules:`);
    const results = [];
    const tasks = modules.map(pkg => {
        return {
            title: `${log.cyan(pkg.name)}`,
            task: async () => {
                const result = await getOutdated(pkg);
                if (result.modules.length > 0 || result.error) {
                    results.push(result);
                }
            },
        };
    });
    const runner = listr(tasks, { concurrent: true, exitOnError: false });
    try {
        await runner.run();
    }
    catch (error) {
    }
    if (results.length > 0) {
        log.info();
        results.forEach(item => printOutdatedModule(item));
        const updated = await updatePackageJsonRefs(modules, await promptToUpdate(results));
        if (updated.length > 0) {
            await run('yarn install', { concurrent: true, modules: updated, printStatus: false });
        }
    }
    else {
        log.info();
        log.info.gray(`All modules up-to-date.`);
    }
    log.info();
}
async function promptToUpdate(outdated) {
    if (outdated.length === 0) {
        return [];
    }
    const updates = {};
    outdated.forEach(outdated => {
        outdated.modules.forEach(m => {
            const { name, latest } = m;
            const current = updates[name] ? updates[name].latest : undefined;
            if (!current || semver.gt(latest, current)) {
                updates[name] = { name, latest: latest };
            }
        });
    });
    const choices = Object.keys(updates).map(key => {
        const update = updates[key];
        const name = `${key} ➜ ${update.latest}`;
        return { name, value: update.name };
    });
    if (choices.length === 0) {
        return [];
    }
    const answer = await inquirer.prompt({
        name: 'update',
        type: 'checkbox',
        choices,
    });
    return Object.keys(updates)
        .map(key => updates[key])
        .filter(update => answer.update.includes(update.name));
}
async function updatePackageJsonRefs(modules, updates) {
    if (updates.length === 0) {
        return [];
    }
    let updated = [];
    for (const update of updates) {
        await Promise.all(modules.map(async (pkg) => {
            const changed = await updatePackageRef(pkg, update.name, update.latest, { save: true });
            if (changed && !updated.some(m => m.name === pkg.name)) {
                updated = [...updated, pkg];
            }
        }));
    }
    if (updated.length > 0) {
        log.info.gray(`\nUpdated:`);
        updated.forEach(pkg => {
            log.info.gray(` - ${log.cyan(pkg.name)}`);
        });
        log.info();
    }
    return updated;
}
async function getOutdated(pkg) {
    const result = { name: pkg.name, modules: [] };
    const cmd = `cd ${pkg.dir} && npm outdated --json`;
    try {
        const res = await exec.cmd.run(cmd, { silent: true });
        const { outdated, error } = parseOutdated(res.info);
        result.modules = outdated;
        result.error = error;
    }
    catch (error) {
        result.error = error.message;
    }
    return result;
}
function parseOutdated(stdout) {
    if (!stdout || stdout.length === 0) {
        return { outdated: [] };
    }
    const json = JSON.parse(stdout.join('\n'));
    const error = json.error;
    if (error) {
        return { error: error.summary, outdated: [] };
    }
    const outdated = Object.keys(json).map(name => {
        const { current, wanted, latest, location } = json[name];
        const outdated = { name, current, wanted, latest, location };
        return outdated;
    });
    return { outdated };
}
function printOutdatedModule(outdated) {
    log.info.yellow(`${outdated.name}`);
    if (outdated.error) {
        log.info.red(outdated.error);
    }
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
    if (outdated.modules.length > 0) {
        table.log();
    }
    log.info();
}
