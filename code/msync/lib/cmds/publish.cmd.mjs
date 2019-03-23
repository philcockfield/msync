import { constants, elapsed, exec, inquirer, listr, loadSettings, log, plural, semver, } from '../common';
import { printTable } from './ls.cmd';
export const name = 'publish';
export const alias = ['p', 'pub'];
export const description = 'Publishes all modules that are ahead of NPM.';
export const args = {};
export async function cmd(args) {
    await publish({});
}
export async function publish(options = {}) {
    const settings = await loadSettings({ npm: true, spinner: true });
    if (!settings) {
        log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
        return;
    }
    const modules = settings.modules.filter(pkg => isPublishRequired(pkg));
    printTable(modules);
    const total = modules.length;
    if (total === 0) {
        log.info.gray(`✨✨  No modules need to be published.\n`);
        return;
    }
    if (!(await promptYesNo(`Publish ${total} ${plural('module', total)} to NPM now?`))) {
        log.info();
        return;
    }
    log.info.gray(`Publishing to NPM:\n`);
    const startedAt = new Date();
    const publishCommand = (pkg) => {
        const install = pkg.engine === 'YARN' ? 'yarn install' : 'npm install';
        return `${install} && npm publish && msync sync`;
    };
    const publishResult = await runCommand(modules, publishCommand, {
        concurrent: false,
        exitOnError: true,
    });
    if (publishResult.success) {
        log.info(`\n✨✨  Done ${log.gray(elapsed(startedAt))}\n`);
    }
    else {
        log.info.yellow(`\n💩  Something went wrong while publishing.\n`);
        log.error(publishResult.error);
    }
}
const runCommand = async (modules, cmd, options) => {
    let errors = [];
    const task = (pkg) => {
        return {
            title: `${log.cyan(pkg.name)} ${log.magenta(cmd(pkg))}`,
            task: async () => {
                const command = `cd ${pkg.dir} && ${cmd(pkg)}`;
                const res = await exec.cmd.run(command, { silent: true });
                if (res.error) {
                    errors = [...errors, { pkg, info: res.info, errors: res.errors }];
                    throw res.error;
                }
                return res;
            },
        };
    };
    const tasks = modules.map(pkg => task(pkg));
    const runner = listr(tasks, options);
    try {
        await runner.run();
        return { success: true, error: null };
    }
    catch (error) {
        errors.forEach(({ info }) => {
            info.forEach(line => log.info(line));
        });
        return { success: false, error };
    }
};
async function promptYesNo(message) {
    const confirm = {
        type: 'list',
        name: 'answer',
        message,
        choices: [{ name: 'Yes', value: 'true' }, { name: 'No', value: 'false' }],
    };
    const res = (await inquirer.prompt(confirm));
    const answer = res.answer;
    return answer === 'true' ? true : false;
}
const isPublishRequired = (pkg) => pkg.npm ? semver.gt(pkg.version, pkg.npm.latest) : false;
