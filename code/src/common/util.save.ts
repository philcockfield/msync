import { time, fs } from './libs';
import * as t from './types';

export const SaveUtil = {
  formatSavePath(input?: boolean | string) {
    if (!input) return undefined;
    if (input === true) return 'msync.list.json';

    if (typeof input === 'string') {
      const text = (input || '')
        .toString()
        .trim()
        .replace(/^\/*/, '')
        .replace(/\.json$/, '');
      return `${text}.json`;
    }

    return undefined;
  },

  toJson(dir: string, modules: t.IModule[]): t.IModulesJson {
    const timestamp = time.now.timestamp;

    const formatDir = (path: string) => {
      return path.startsWith(dir) ? path.substring(dir.length + 1) : path;
    };

    const json: t.IModulesJson = {
      order: 'DepthFirst',
      timestamp,
      dir,
      modules: modules.map((module) => {
        const { name, version } = module;
        const dir = formatDir(module.dir);
        const latest = module.npm?.latest;
        const npm = latest ? { version: latest } : undefined;
        return { dir, name, version, npm };
      }),
    };
    return json;
  },

  async write(path: string, modules: t.IModule[]) {
    const dir = fs.resolve('.');
    const obj = SaveUtil.toJson(dir, modules);
    const json = `${JSON.stringify(obj, null, '  ')}\n`;
    await fs.writeFile(fs.resolve(path), json);
  },
};
