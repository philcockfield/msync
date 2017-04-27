import { log, file, settings, printTitle } from '../common';



// export const group = 'dev';
export const name = 'foo';
export const alias = 'f';
export const description = 'Sample script.';




export async function cmd(
  args?: {
    params: string[],
    options: {},
  },
) {

  log.info.magenta('Foo!!!\n');

  // file.findClosestAncestor(process.cwd(), '.sync.yaml');

  printTitle('Config');

  const s = await settings.init();

  console.log('settings', s);

  // file.findAncestor()

}
