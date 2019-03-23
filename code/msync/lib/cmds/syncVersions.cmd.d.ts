import { IModule, ISettings } from '../common';
export declare const name = "sync-versions";
export declare const alias: string[];
export declare const description = "Updates version reference in package.json files.";
export declare const args: {
    '-i': string;
};
export declare function cmd(args?: {
    params: string[];
    options: {
        i?: boolean;
    };
}): Promise<void>;
export interface ISyncVersionOptions {
    includeIgnored?: boolean;
    silent?: boolean;
}
export declare function syncVersions(options?: ISyncVersionOptions): Promise<{
    settings: ISettings;
    modules: IModule[];
} | undefined>;
