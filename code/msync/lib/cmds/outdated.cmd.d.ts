export declare const name = "outdated";
export declare const alias = "o";
export declare const description = "Checks all modules for outdated references on NPM.";
export declare function cmd(args?: {
    params: string[];
    options: {};
}): Promise<void>;
export declare function outdated(options: {
    includeIgnored?: boolean;
}): Promise<void>;
