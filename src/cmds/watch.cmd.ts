import { exec } from '../common';


export const name = 'watch';
export const alias = 'w';
export const description = 'Starts watchers for `build` and `sync` in new tabs.';
export const args = {
};


export async function cmd(
  args?: {
    params: string[],
    options: {},
  },
) {
  const path = process.cwd();
  await exec.inNewTab(`msync sync -w`, path);
  await exec.inNewTab(`msync build -w`, path);
}
