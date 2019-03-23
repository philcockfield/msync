import { IModule } from '../types';
export interface IIgnore {
    paths: string[];
    names: string[];
}
export interface IYaml {
    modules: string[];
    ignore: IIgnore;
    watchPattern: string;
}
export interface ISettings {
    path: string;
    modules: IModule[];
    ignored: IIgnore;
    watchPattern: string;
}
export interface IOptions {
    npm?: boolean;
    spinner?: boolean;
}
export declare function loadSettings(options?: IOptions): Promise<ISettings | undefined>;
