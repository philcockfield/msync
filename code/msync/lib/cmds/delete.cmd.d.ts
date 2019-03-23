export declare const name = "delete";
export declare const alias = "del";
export declare const description = "Deletes transient files across projects (such as logs, yarn.lock, node_modules etc).";
export declare const args: {
    '-i': string;
};
export declare function cmd(args?: {
    params: string[];
    options: {
        i?: boolean;
    };
}): Promise<void>;
