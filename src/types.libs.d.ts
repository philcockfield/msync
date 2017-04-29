declare module 'toposort' {
  type Node = string | number;
  interface IToposort {
    array<T>(nodes: T[], edges: T[][]): T[];
    <T>(edges: T[][]): T[];
  }
  const Toposort: IToposort;
  export = Toposort;
}



declare module 'execa' {
  const execa: any;
  export = execa;
}



interface IListrTask {
  title: string;
  task: () => void;
  skip?: () => void;
}
interface IListrOptions {
  concurrent?: boolean;
  exitOnError?: boolean;
}
declare class Listr {
  public constructor(tasks?: IListrTask[], options?: IListrOptions);
  public run(): Promise<void>;
  public add(task: IListrTask): Listr;
}
declare module 'listr' {
  const listr = Listr;
  export = listr;
}

