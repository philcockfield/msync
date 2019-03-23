import { constants, dependsOn, filter, inquirer, loadSettings, log, R, savePackage, semver, updatePackageRef, } from '../common';
import * as listCommand from './ls.cmd';
export const name = 'bump';
export const alias = 'b';
export const description = `Bumps a module version along with it's entire dependency graph.`;
export const args = {
    '-i': 'Include ignored modules.',
    '-d': 'Dry run where no files are saved.',
    '-l': 'Local versions only. Does not retrieve NPM details.',
};
export async function cmd(args) {
    const options = (args && args.options) || {};
    await bump({
        includeIgnored: options.i || false,
        local: options.l || false,
        dryRun: options.d || false,
    });
}
export async function bump(options = {}) {
    const { includeIgnored = false, local = false, dryRun = false } = options;
    const save = !dryRun;
    const npm = !local;
    const settings = await loadSettings({ npm, spinner: npm });
    if (!settings) {
        log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
        return;
    }
    const modules = settings.modules.filter(pkg => filter.includeIgnored(pkg, includeIgnored));
    const module = await promptForModule(modules);
    if (!module) {
        return;
    }
    const dependants = dependsOn(module, modules);
    listCommand.printTable([module], { includeIgnored: true, dependants });
    if (dryRun) {
        log.info.gray(`Dry run...no files will be saved.\n`);
    }
    const release = (await promptForReleaseType(module.version));
    if (!release) {
        return;
    }
    log.info();
    const tableBuilder = await bumpModule({
        release,
        pkg: module,
        allModules: modules,
        save,
    });
    tableBuilder.log();
    if (dryRun) {
        log.info.gray(`\nNo files were saved.`);
    }
    else {
        log.info();
    }
}
async function bumpModule(options) {
    const { release, pkg, allModules, save, level = 0, ref } = options;
    const dependants = dependsOn(pkg, allModules);
    const version = semver.inc(pkg.latest, release);
    const isRoot = ref === undefined;
    if (!version) {
        throw new Error(`Failed to '${release}' the semver ${pkg.latest}.`);
    }
    const head = ['update', 'module', 'version', 'ref updated'].map(title => log.gray(title));
    const tableBuilder = options.table || log.table({ head });
    if (!ref) {
        let msg = '';
        msg += `  ${log.yellow(release.toUpperCase())} `;
        msg += `update ${log.cyan(pkg.name)} from ${log.gray(pkg.latest)} ${log.gray('=>')} ${log.magenta(version)} `;
        log.info.gray(msg);
    }
    else {
        tableBuilder.add([
            log.yellow(release.toUpperCase()),
            log.cyan(pkg.name),
            log.gray(`${pkg.latest} => ${log.magenta(version)}`),
            log.gray(`${log.cyan(ref.name)} ${ref.fromVersion} => ${log.magenta(ref.toVersion)}`),
        ]);
    }
    const json = R.clone(pkg.json);
    json.version = version;
    if (save) {
        await savePackage(pkg.dir, json);
    }
    if (isRoot && dependants.length > 0) {
        log.info.gray('\nDependant modules:');
    }
    for (const dependentPkg of dependants) {
        await updatePackageRef(dependentPkg, pkg.name, version, { save });
        await bumpModule({
            release: 'patch',
            pkg: dependentPkg,
            allModules,
            level: level + 1,
            ref: { name: pkg.name, fromVersion: pkg.latest, toVersion: version },
            save,
            table: tableBuilder,
        });
    }
    return tableBuilder;
}
async function promptForModule(modules) {
    const choices = modules.map(pkg => ({ name: pkg.name, value: pkg.name }));
    const confirm = {
        type: 'list',
        name: 'name',
        message: 'Select a module',
        choices,
    };
    const res = (await inquirer.prompt(confirm));
    const name = res.name;
    return modules.find(pkg => pkg.name === name);
}
async function promptForReleaseType(version) {
    const choices = ['patch', 'minor', 'major'];
    const confirm = {
        type: 'list',
        name: 'name',
        message: 'Release',
        choices,
    };
    const res = (await inquirer.prompt(confirm));
    return res.name;
}
