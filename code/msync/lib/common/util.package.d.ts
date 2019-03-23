import { IModule } from '../types';
export declare function toPackages(moduleDirs: string[]): Promise<IModule[]>;
export declare function orderByDepth(packages: IModule[]): IModule[];
export declare function dependsOn(pkg: IModule, modules: IModule[]): IModule[];
export declare function updatePackageRef(target: IModule, moduleName: string, newVersion: string, options: {
    save: boolean;
}): Promise<boolean>;
export declare function savePackage(dir: string, json: object): Promise<void>;
