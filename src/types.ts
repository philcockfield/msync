export interface IModule {
  dir: string;
  name: string;
  version: string;
  isIgnored: boolean;
  isTypeScript: boolean;
  dependencies: IDependency[];
}


export interface IDependency {
  name: string;
  version: string;
  isDev: boolean;
  isLocal: boolean;
  package?: IModule;
}
