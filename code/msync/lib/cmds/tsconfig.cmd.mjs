import { parse } from 'path';
import { constants, filter, fs, inquirer, listr, loadSettings, log, value as valueUtil, } from '../common';
export const name = 'tsconfig';
export const alias = 'ts';
export const description = `Common transformations across typescript configuration files.`;
export const args = {
    '-i': 'Include ignored modules.',
};
export async function cmd(args) {
    const options = (args && args.options) || {};
    const includeIgnored = options.i || false;
    const settings = await loadSettings();
    if (!settings) {
        log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
        return;
    }
    const response = (await inquirer.prompt([
        {
            type: 'list',
            name: 'type',
            message: 'Change?',
            choices: ['noUnusedLocals: true', 'noUnusedLocals: false'],
        },
    ]));
    log.info();
    const paths = await getTsconfigPaths(settings, { includeIgnored });
    const parts = toChoiceParts(response.type);
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
async function getTsconfigPaths(settings, options) {
    const { includeIgnored = false } = options;
    const paths = settings.modules
        .filter(pkg => filter.includeIgnored(pkg, includeIgnored))
        .map(m => m.dir)
        .map(dir => fs.join(dir, 'tsconfig.json'));
    return filter.fileExists(paths);
}
async function saveChangesWithPrompt(paths, changes) {
    if (paths.length === 0) {
        log.info.gray('No files to change.');
        return false;
    }
    log.info.cyan(`\nChange files:`);
    paths.forEach(path => {
        log.info(` ${toDisplayPath(path)}`);
    });
    log.info();
    const response = (await inquirer.prompt([
        {
            type: 'list',
            name: 'confirm',
            message: 'Are you sure?',
            choices: ['No', 'Yes'],
        },
    ]));
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
function toDisplayPath(path) {
    const root = parse(path);
    const dir = parse(root.dir);
    return log.gray(`${dir.dir}/${log.magenta(dir.base)}/${log.cyan(root.base)}`);
}
async function saveChanges(paths, changes) {
    const saveChange = async (path) => {
        const json = await fs.readJson(path);
        const compilerOptions = Object.assign({}, json.compilerOptions, changes);
        const tsConfig = Object.assign({}, json, { compilerOptions });
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
    }
    catch (error) {
    }
}
function toChoiceParts(choice) {
    const parts = choice.split(':');
    const key = parts[0].trim();
    const value = valueUtil.toType(parts[1].trim());
    return { key, value };
}
