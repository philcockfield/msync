import * as chalk from 'chalk';
import command from 'command-interface';

import { log } from './common';

log.info(chalk.bgMagenta.black(' MSYNC '));
command(`${__dirname}/**/*.cmd.js`);
