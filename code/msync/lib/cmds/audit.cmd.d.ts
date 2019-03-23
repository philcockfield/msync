export interface IAuditResult {
    module: string;
    version: string;
    ok: boolean;
    issues: number;
    vulnerabilities: {
        info: number;
        low: number;
        moderate: number;
        high: number;
        critical: number;
    };
}
export declare const name = "audit";
export declare const alias: string[];
export declare const description = "Runs an NPM security audit across all modules.";
export declare const args: {};
export declare function cmd(args?: {
    params: string[];
    options: {};
}): Promise<void>;
export declare function audit(options?: {}): Promise<void>;
