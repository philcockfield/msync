export type INpmInfo = { name: string; version: string; latest: string };

export interface IModule {
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
}

export interface IDependency {
  name: string;
  version: string;
  isDev: boolean;
  isLocal: boolean;
  package?: IModule;
}

export { ILogTable } from '@platform/log/lib/server';
