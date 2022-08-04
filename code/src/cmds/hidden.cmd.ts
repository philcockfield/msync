import { constants, fs, loadSettings, log } from '../common';

export const name = 'hidden';
export const alias = 'h';
export const description = 'Find and copy out all hidden configuration files.';
export const args = {};

/**
 * CLI command.
 */
export async function cmd(args?: { params: string[] }) {
  const settings = await loadSettings({ npm: false, spinner: true });
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }

  const base = fs.resolve('.');
  const targetDir = fs.join(base, '.msync.hidden');
  await fs.remove(targetDir);
  await fs.ensureDir(targetDir);

  let count = 0;

  for (const pattern of settings.hidden) {
    const paths = await fs.glob.find(fs.join(base, pattern));

    for (const path of paths) {
      const relative = path.substring(base.length + 1);
      const filename = fs.basename(relative);
      const dir = relative.substring(0, relative.length - filename.length);
      await fs.copy(path, fs.join(targetDir, relative));

      log.info.gray(`• ${dir}${log.white(filename)}`);
      count++;
    }
  }

  if (count === 0) {
    log.info.gray(`No hidden files found`);
  } else {
    log.info();
    log.info.gray(`saved files into: ${log.white(targetDir)}`);
  }
}
