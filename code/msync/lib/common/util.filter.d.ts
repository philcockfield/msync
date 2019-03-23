import { IDependency, IModule } from '../types';
export declare const localDeps: (pkg: IModule) => IDependency[];
export declare const includeIgnored: (pkg: IModule | undefined, includeIgnored: boolean) => boolean;
export declare function fileExists(paths: string[]): Promise<string[]>;
