import { IModule } from '../common';
export declare const name = "run";
export declare const alias = "r";
export declare const description = "Runs the given command on all modules.";
export declare const args: {
    '<command>': string;
    '-i': string;
    '-c': string;
};
export declare function cmd(args?: {
    params: string[];
    options: {
        i?: boolean;
        c?: boolean;
    };
}): Promise<void>;
export declare function run(cmd: string, options?: {
    printStatus?: boolean;
    includeIgnored?: boolean;
    concurrent?: boolean;
    modules?: IModule[];
}): Promise<void>;
