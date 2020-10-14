declare module 'toposort' {
  type Node = string | number; // eslint-disable-line
  interface IToposort {
    array<T>(nodes: T[], edges: T[][]): T[];
    <T>(edges: T[][]): T[];
  }
  const Toposort: IToposort;
  export = Toposort;
}
