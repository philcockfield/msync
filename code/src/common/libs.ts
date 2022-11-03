import {
  clone,
  equals,
  find,
  isEmpty,
  isNil,
  pipe,
  prop,
  propEq,
  reject,
  sortBy,
  uniqBy,
} from 'ramda';
import * as toposort from 'toposort';

export { toposort };
export const R = {
  sortBy,
  uniqBy,
  isNil,
  reject,
  isEmpty,
  find,
  propEq,
  clone,
  prop,
  pipe,
  equals,
};

export { moment, file, listr, IListrOptions, inquirer, plural } from 'command-interface';

/**
 * @platform
 */
export { log } from '@platform/log/lib/server';
export { exec } from '@platform/exec';
export { value, time, defaultValue } from '@platform/util.value';
export { npm, semver } from '@platform/npm';
export { fs } from '@platform/fs';
