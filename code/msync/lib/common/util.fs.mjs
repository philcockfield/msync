import { fs } from './libs';
export async function tryDelete(path, options = {}) {
    const retry = options.retry === undefined ? 3 : options.retry;
    let count = 0;
    do {
        count++;
        try {
            await fs.remove(path);
        }
        catch (error) {
            if (count >= retry) {
                throw error;
            }
        }
    } while (count < retry);
}
