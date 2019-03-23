import { npm } from './libs';
import { compact } from './util';
export async function info(pkg) {
    const modules = (Array.isArray(pkg) ? pkg : [pkg]).filter(pkg => pkg.json.private !== true);
    const items = await Promise.all(modules.map(item => npm.getInfo(item.name)));
    return compact(items);
}
