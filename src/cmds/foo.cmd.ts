import {
  log,
  file,
  config,
  printTitle,
  constants,
  IPackageObject,
} from '../common';



// export const group = 'dev';
export const name = 'ls';
// export const alias = 'f';
export const description = 'Lists the modules.';




export async function cmd(
  args?: {
    params: string[],
    options: {},
  },
) {
  const logModule = (module: IPackageObject) => {
    log.info.magenta(`- ${log.cyan(module.name)} ${module.version}`)
  };

  const settings = await config.init();
  const modules = settings && settings.modules;

  if (modules) {
    modules.forEach(logModule)
    log.info();
  } else {
    log.warn.yellow(`No modules defined within the '${constants.CONFIG_FILE_NAME}' file.`)
  }
}
