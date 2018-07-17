import { fs } from './libs';

/**
 * Attempts to delete the given path the given number of times.
 */
export async function tryDelete(
  path: string,
  options: { retry?: number } = {},
) {
  const retry = options.retry === undefined ? 3 : options.retry;
  let count = 0;
  do {
    count++;
    try {
      await fs.removeAsync(path);
    } catch (error) {
      if (count >= retry) {
        throw error;
      }
    }
  } while (count < retry);
}
