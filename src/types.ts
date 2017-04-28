

export interface IPackageObject {
  path: string;
  name: string;
  version: string;
  dependencies: IDependency[];
}


export interface IDependency {
  name: string;
  version: string;
  isDev: boolean;
  isLocal: boolean;
}
