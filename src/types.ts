

export interface IPackageObject {
  dir: string;
  name: string;
  version: string;
  dependencies: IDependency[];
}


export interface IDependency {
  name: string;
  version: string;
  isDev: boolean;
  isLocal: boolean;
  package?: IPackageObject;
}
