import * as constants from './constants';
import { file, fs, listr, log, semver } from './libs';
import * as npm from './util.npm';
import { orderByDepth, toPackages } from './util.package';
export async function loadSettings(options = {}) {
    const { spinner = false, npm = false } = options;
    if (spinner) {
        let result;
        const title = npm
            ? 'Loading module info locally and from NPM.'
            : 'Loading module info locally.';
        const task = {
            title,
            task: async () => (result = await loadSettingsInternal(options)),
        };
        await listr([task]).run();
        log.info();
        return result;
    }
    else {
        return loadSettingsInternal(options);
    }
}
async function loadSettingsInternal(options = {}) {
    const path = await file.findClosestAncestor(process.cwd(), constants.CONFIG_FILE_NAME);
    if (!path) {
        return;
    }
    const yaml = await loadYaml(path);
    if (!yaml) {
        return;
    }
    const dir = fs.dirname(path);
    yaml.modules = yaml.modules.map(path => fs.resolve(dir, path));
    let modules = await toPackages(yaml.modules);
    modules = orderByDepth(modules);
    const ignore = {
        paths: await ignorePaths(yaml, dir),
        names: yaml.ignore.names,
    };
    modules.forEach(pkg => (pkg.isIgnored = isIgnored(pkg, ignore)));
    if (options.npm) {
        const npmModules = await npm.info(modules.filter(pkg => !pkg.isIgnored));
        modules.forEach(pkg => {
            pkg.npm = npmModules.find(item => item.name === pkg.name);
            if (pkg.npm && semver.gt(pkg.npm.latest, pkg.version)) {
                pkg.latest = pkg.npm.latest;
            }
        });
    }
    return {
        path,
        ignored: ignore,
        watchPattern: yaml.watchPattern,
        modules,
    };
}
async function ignorePaths(yaml, dir) {
    const result = [];
    for (const pattern of yaml.ignore.paths) {
        const paths = await fs.glob.find(fs.resolve(dir, pattern));
        paths.forEach(path => result.push(path));
    }
    return result;
}
function isIgnored(pkg, ignore) {
    if (ignore.names.includes(pkg.name)) {
        return true;
    }
    for (const path of ignore.paths) {
        if (pkg.dir.startsWith(path)) {
            return true;
        }
    }
    return false;
}
async function loadYaml(path) {
    try {
        const result = await file.yaml(path);
        result.modules = result.modules || [];
        result.ignore = result.ignore || { paths: [] };
        result.ignore.paths = result.ignore.paths || [];
        result.ignore.names = result.ignore.names || [];
        result.watchPattern = result.watchPattern || constants.DEFAULT_WATCH_PATTERN;
        return result;
    }
    catch (error) {
        log.error(`Failed to parse YAML configuration.`);
        log.error(error.message);
        log.info(log.magenta('File:'), path, '\n');
    }
    return;
}
