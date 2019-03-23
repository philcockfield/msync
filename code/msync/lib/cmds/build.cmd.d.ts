import { IModule } from '../common';
export declare const name = "build";
export declare const description = "Builds and syncs all typescript modules in order.";
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
export declare function build(options?: {
    includeIgnored?: boolean;
    watch?: boolean;
    verbose?: boolean;
}): Promise<void>;
export declare function buildOnce(modules: IModule[]): Promise<void>;
export declare function buildWatch(modules: IModule[], includeIgnored: boolean, verbose: boolean): Promise<void>;
