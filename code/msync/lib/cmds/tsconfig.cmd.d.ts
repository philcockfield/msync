export declare const name = "tsconfig";
export declare const alias = "ts";
export declare const description = "Common transformations across typescript configuration files.";
export declare const args: {
    '-i': string;
};
export declare function cmd(args?: {
    params: string[];
    options: {
        i?: boolean;
    };
}): Promise<void>;
