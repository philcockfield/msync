export declare const name = "publish";
export declare const alias: string[];
export declare const description = "Publishes all modules that are ahead of NPM.";
export declare const args: {};
export declare function cmd(args?: {
    params: string[];
    options: {};
}): Promise<void>;
export declare function publish(options?: {}): Promise<void>;
