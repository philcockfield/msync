import { log } from './common';
import chalk from 'chalk';
import command from 'command-interface';

log.info(chalk.bgMagenta.black(' MSYNC '));
command(`${__dirname}/**/*.cmd.js`);
