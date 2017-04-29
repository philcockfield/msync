import {
  log,
  config,
  constants,
  filter,
} from '../common';

export const name = 'build';
export const alias = 'b';
export const description = 'Builds all typescript modules.';
export const args = {
  '-i': 'Include ignored modules.',
};


/**
 * CLI command.
 */
export async function cmd(
  args?: {
    params: string[],
    options: {
      i?: boolean;
    },
  },
) {

  const options = (args && args.options) || {};
  await build({
    includeIgnored: options.i,
  });
}


export interface IOptions {
  includeIgnored?: boolean;
}

/**
 * Builds all typescript modules.
 */
export async function build(options: IOptions = {}) {
  const { includeIgnored = false } = options;
  const settings = await config.init();
  if (!settings) {
    log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
    return;
  }
  const modules = settings
    .modules
    .filter((pkg) => filter.includeIgnored(pkg, includeIgnored))
    .filter((pkg) => pkg.isTypeScript)



  console.log("build modules", modules.map((m) => m.name));
}

