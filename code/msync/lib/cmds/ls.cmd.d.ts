import { IModule, ISettings } from '../common';
export declare const name = "ls";
export declare const alias = "l";
export declare const description = "Lists modules in dependency order.";
export declare const args: {
    '-D': string;
    '-i': string;
    '-p': string;
    '-n': string;
    '--no-formatting': string;
};
export declare function cmd(args?: {
    params: string[];
    options: {
        D?: boolean;
        i?: boolean;
        p?: boolean;
        n?: boolean;
        formatting?: boolean;
    };
}): Promise<void>;
export declare type DisplayDependencies = 'none' | 'local' | 'all';
export interface ITableColumn {
    head?: string;
    render: (data: any) => string;
}
export interface IListOptions {
    basePath?: string;
    dependencies?: DisplayDependencies;
    includeIgnored?: boolean;
    showPath?: boolean;
    formatting?: boolean;
    dependants?: IModule[];
    npm?: boolean;
    columns?: ITableColumn[];
}
export declare function ls(options?: IListOptions): Promise<{
    modules: IModule[];
    settings: ISettings;
} | undefined>;
export declare function printTable(modules: IModule[], options?: IListOptions): void;
