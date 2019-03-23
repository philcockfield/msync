import * as toposort from 'toposort';
import { fs, R } from './libs';
import { compact } from './util';
export async function toPackages(moduleDirs) {
    const packages = [];
    for (const pattern of moduleDirs) {
        const matches = await fs.glob.find(pattern);
        for (const path of matches) {
            if (!path.includes('node_modules/')) {
                packages.push(await toPackage(path));
            }
        }
    }
    const findPackage = (dep) => packages.find(pkg => pkg.name === dep.name);
    packages.forEach(pkg => {
        pkg.dependencies.forEach(dep => {
            dep.package = findPackage(dep);
            dep.isLocal = dep.package !== undefined;
        });
    });
    return packages;
}
async function toPackage(packageFilePath) {
    const parse = async () => {
        try {
            const text = (await fs.readFile(packageFilePath)).toString();
            const json = JSON.parse(text);
            return json;
        }
        catch (error) {
            throw new Error(`Failed to parse '${packageFilePath}'. ${error.message}`);
        }
    };
    const json = await parse();
    let dependencies = [];
    const addDeps = (deps, isDev) => {
        if (!deps) {
            return;
        }
        Object.keys(deps).forEach(name => dependencies.push({
            name,
            version: deps[name],
            isDev,
            isLocal: false,
        }));
    };
    addDeps(json.dependencies, false);
    addDeps(json.peerDependencies, false);
    addDeps(json.devDependencies, true);
    dependencies = R.sortBy(R.prop('name'), dependencies);
    dependencies = R.uniqBy((dep) => dep.name, dependencies);
    const version = json.version;
    const dir = fs.resolve(packageFilePath, '..');
    const hasScripts = json.scripts !== undefined;
    const hasPrepublish = hasScripts && json.scripts.prepublish !== undefined;
    const tsconfigPath = fs.join(dir, 'tsconfig.json');
    const isTypeScript = await fs.pathExists(tsconfigPath);
    const tsconfig = isTypeScript ? await fs.readJson(tsconfigPath) : undefined;
    const gitignorePath = fs.join(dir, '.gitignore');
    const gitignore = (await fs.pathExists(gitignorePath))
        ? (await fs.readFile(gitignorePath)).toString().split('\n')
        : [];
    const engine = await getEngine(dir);
    return {
        engine,
        dir,
        name: json.name,
        version,
        latest: version,
        isTypeScript,
        gitignore,
        hasScripts,
        hasPrepublish,
        tsconfig,
        isIgnored: false,
        dependencies,
        json,
    };
}
async function getEngine(dir) {
    const exists = (file) => fs.pathExists(fs.join(dir, file));
    if (await exists('yarn.lock')) {
        return 'YARN';
    }
    if (await exists('package-lock.json')) {
        return 'NPM';
    }
    return 'NPM';
}
export function orderByDepth(packages) {
    const toDependenciesArray = (pkg) => {
        const deps = pkg.dependencies;
        const result = deps.map(dep => dep.name).map(name => [pkg.name, name]);
        return deps.length === 0 ? [[pkg.name]] : result;
    };
    const graph = packages
        .map(pkg => toDependenciesArray(pkg))
        .reduce((acc, items) => {
        items.forEach(item => acc.push(item));
        return acc;
    }, []);
    const names = toposort(graph).reverse();
    const result = names.map(name => R.find(R.propEq('name', name), packages));
    return R.reject(R.isNil, result);
}
export function dependsOn(pkg, modules) {
    const result = modules.filter(module => module.dependencies.find(dep => dep.name === pkg.name) !== undefined);
    return compact(result);
}
export async function updatePackageRef(target, moduleName, newVersion, options) {
    const { save = false } = options || {};
    let changed = false;
    const prefix = (version) => ['^', '~'].filter(p => version && version.startsWith(p))[0] || '';
    ['dependencies', 'devDependencies', 'peerDependencies'].forEach(key => {
        const obj = target.json[key];
        if (obj && obj[moduleName]) {
            const currentValue = obj[moduleName];
            const newValue = `${prefix(currentValue)}${newVersion}`;
            if (newValue !== currentValue) {
                obj[moduleName] = newValue;
                changed = true;
            }
        }
    });
    if (save && changed) {
        await savePackage(target.dir, target.json);
    }
    return changed;
}
export async function savePackage(dir, json) {
    const text = `${JSON.stringify(json, null, '  ')}\n`;
    await fs.writeFile(fs.join(dir, 'package.json'), text);
}
