import { fs } from './libs';
export const localDeps = (pkg) => {
    return pkg.dependencies.filter((dep) => dep.isLocal);
};
export const includeIgnored = (pkg, includeIgnored) => {
    if (!pkg) {
        return true;
    }
    return includeIgnored ? true : !pkg.isIgnored;
};
export async function fileExists(paths) {
    const checking = paths.map(async (path) => {
        const exists = await fs.pathExists(path);
        return { path, exists };
    });
    const results = await Promise.all(checking);
    return results.filter(result => result.exists).map(result => result.path);
}
