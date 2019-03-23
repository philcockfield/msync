import { IModule } from '.';
export declare function module(from: {
    name: string;
    dir: string;
    gitignore: string[];
}, to: {
    name: string;
    dir: string;
}): Promise<void>;
export declare function logUpdate(target: IModule): Promise<void>;
