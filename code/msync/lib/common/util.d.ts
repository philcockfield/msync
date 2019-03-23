export declare function flatten<T>(list: any): T[];
export declare const compact: <T>(value: T[]) => T[];
export declare function write(msg: any, silent?: boolean): void;
export declare function elapsed(startedAt: Date): string;
export declare function round(value: number, decimals: number): number;
export declare function delay(msecs: number): Promise<{}>;
