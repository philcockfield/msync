export { ILogTable } from '@platform/log/lib/server';

export type INpmInfo = { name: string; version: string; latest: string };

export type IModule = {
  engine: 'NPM' | 'YARN';
  dir: string;
  name: string;
  version: string;
  latest: string;
  isIgnored: boolean;
  isTypeScript: boolean;
  gitignore: string[];
  hasScripts: boolean;
  hasPrepublish: boolean;
  tsconfig?: any;
  dependencies: IDependency[];
  json: any;
  npm?: INpmInfo;
};

export type IDependency = {
  name: string;
  version: string;
  isDev: boolean;
  isLocal: boolean;
  package?: IModule;
};

export type IModulesJson = {
  timestamp: number; // ISO timestamp
  order: 'DepthFirst';
  dir: string;
  modules: IModuleJson[];
};

export type IModuleJson = {
  dir: string;
  name: string;
  version: string;
  npm?: { version: string };
};
