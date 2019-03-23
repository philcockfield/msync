export declare const name = "bump";
export declare const alias = "b";
export declare const description = "Bumps a module version along with it's entire dependency graph.";
export declare const args: {
    '-i': string;
    '-d': string;
    '-l': string;
};
export declare type ReleaseType = 'major' | 'minor' | 'patch';
export declare function cmd(args?: {
    params: string[];
    options: {
        i?: boolean;
        d?: boolean;
        l?: boolean;
    };
}): Promise<void>;
export interface IOptions {
    includeIgnored?: boolean;
    local?: boolean;
    dryRun?: boolean;
}
export declare function bump(options?: IOptions): Promise<void>;
