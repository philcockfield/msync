import * as execa from 'execa';
import { Subject } from './libs';


export interface IRunOptions {
  silent?: boolean;
}


/**
 * Runs the given command.
 */
export function run(command: string, options: IRunOptions = {}) {
  return invoke(command, options);
}


// export type OutputType = 'stdout' | 'stderr';
export interface IResponse {
  text: string;
  isError: boolean;
}


/**
 * Runs the command as an observable.
 */
export function run$(command: string) {
  const subject = new Subject<IResponse>();
  const child = invoke(command, { silent: true });

  const next = (data: Buffer, isError: boolean) => subject.next({
    text: data.toString(),
    isError,
  });
  child.stdout.on('data', (data: Buffer) => next(data, false));
  child.stderr.on('data', (data: Buffer) => next(data, true));

  return subject;
}



function invoke(cmd: string, options: IRunOptions = {}) {
  const { silent = false } = options;

  // Invoke the command.
  const promise = execa.shell(cmd);

  // Write to console.
  if (!silent) {
    promise.stdout.pipe(process.stdout);
  }

  // Finish up.
  return promise;
}
