import { IModule, ISettings } from '../common';
export declare const name = "sync";
export declare const alias: string[];
export declare const description = "Syncs each module's dependency tree within the workspace.";
export declare const args: {
    '-i': string;
    '-w': string;
    '-v': string;
};
export declare function cmd(args?: {
    params: string[];
    options: {
        i?: boolean;
        w?: boolean;
        v?: boolean;
    };
}): Promise<void>;
export interface ISyncOptions {
    includeIgnored?: boolean;
    updateVersions?: boolean;
    silent?: boolean;
}
export declare function sync(options?: ISyncOptions): Promise<{
    settings: ISettings;
    modules: IModule[];
} | undefined>;
export declare function syncModules(modules: IModule[], options?: ISyncOptions): Promise<IModule[]>;
export declare function chmod(module: IModule): Promise<string[]>;
export declare function syncWatch(options?: ISyncOptions): Promise<void>;
