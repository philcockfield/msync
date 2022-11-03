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

  toJson(modules: t.IModule[]): t.IModulesJson {
    const timestamp = time.now.timestamp;

    const json: t.IModulesJson = {
      timestamp,
      order: 'DepthFirst',
      modules: modules.map((module) => {
        const { name, version, dir } = module;
        const latest = module.npm?.latest;
        const npm = latest ? { version: latest } : undefined;
        return { dir, name, version, npm };
      }),
    };
    return json;
  },

  async write(path: string, modules: t.IModule[]) {
    path = fs.resolve(path);
    const obj = SaveUtil.toJson(modules);
    const json = `${JSON.stringify(obj, null, '  ')}\n`;
    await fs.writeFile(path, json);
  },
};
