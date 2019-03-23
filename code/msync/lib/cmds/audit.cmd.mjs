import { constants, elapsed, exec, fs, listr, loadSettings, log, } from '../common';
export const name = 'audit';
export const alias = ['a'];
export const description = 'Runs an NPM security audit across all modules.';
export const args = {};
export async function cmd(args) {
    await audit({});
}
export async function audit(options = {}) {
    const settings = await loadSettings({ npm: true, spinner: true });
    if (!settings) {
        log.warn.yellow(constants.CONFIG_NOT_FOUND_ERROR);
        return;
    }
    log.info.gray(`Auditing modules:\n`);
    const startedAt = new Date();
    const res = await runAudits(settings.modules, {
        concurrent: true,
        exitOnError: false,
    });
    const totalIssues = res.data.reduce((acc, next) => acc + next.issues, 0);
    if (totalIssues > 0) {
        printAudit(res.data);
    }
    if (res.success) {
        const msg = totalIssues === 0 ? log.green(`All modules are safe.`) : 'Done';
        log.info(`\n✨✨  ${msg} ${log.gray(elapsed(startedAt))}\n`);
    }
    else {
        log.info.yellow(`\n💩  Something went wrong while running the audit.\n`);
    }
}
function levelColor(level) {
    switch (level) {
        case 'info':
            return log.white;
        case 'low':
        case 'moderate':
            return log.yellow;
        case 'high':
        case 'critical':
            return log.red;
    }
}
function printAudit(results) {
    const head = [log.gray('module'), log.red('vulnerabilities')];
    const builder = log.table({ head });
    results
        .filter(audit => !audit.ok)
        .forEach(audit => {
        const bullet = audit.ok ? log.green('✔') : log.red('✖');
        const output = Object.keys(audit.vulnerabilities)
            .map(key => ({ key: key, value: audit.vulnerabilities[key] }))
            .reduce((acc, next) => {
            const text = next.value > 0 ? log.gray(`${next.key}: ${levelColor(next.key)(next.value)}`) : '';
            return text ? `${acc} ${text}` : acc;
        }, '')
            .trim();
        builder.add([
            log.gray(`${bullet} ${log.cyan(audit.module)} ${audit.version}`),
            output || log.green('safe'),
        ]);
    });
    log.info();
    builder.log();
}
async function runAudits(modules, options) {
    let data = [];
    const task = (pkg) => {
        return {
            title: `${log.cyan(pkg.name)} ${log.gray('npm audit')}`,
            task: async () => {
                const npmLockFile = fs.join(pkg.dir, 'package-lock.json');
                const hasNpmLock = await fs.pathExists(npmLockFile);
                const cmd = (text) => `cd ${pkg.dir} && ${text}`;
                const commands = {
                    install: cmd(`npm install`),
                    audit: cmd(`npm audit --json`),
                };
                await exec.cmd.run(commands.install, { silent: true });
                const json = await execToJson(commands.audit);
                if (json && json.error) {
                    throw new Error(json.error.summary);
                }
                const vulnerabilities = json
                    ? json.metadata.vulnerabilities
                    : [];
                const issues = Object.keys(vulnerabilities)
                    .map(key => ({ key, value: vulnerabilities[key] }))
                    .reduce((acc, next) => (next.value > 0 ? acc + next.value : acc), 0);
                if (!hasNpmLock) {
                    await fs.remove(npmLockFile);
                }
                const result = {
                    module: pkg.name,
                    version: pkg.version,
                    ok: issues === 0,
                    issues,
                    vulnerabilities,
                };
                data = [...data, result];
                return result;
            },
        };
    };
    const tasks = modules.map(pkg => task(pkg));
    const runner = listr(tasks, options);
    try {
        await runner.run();
        return { success: true, data, error: null };
    }
    catch (error) {
        return { success: false, data, error };
    }
}
async function execToJson(cmd) {
    const done = (stdout, error) => {
        try {
            return JSON.parse(stdout);
        }
        catch (error) {
            throw error;
        }
    };
    try {
        const res = await exec.cmd.run(cmd, { silent: true });
        return done(res.info.join('\n'));
    }
    catch (error) {
        return done(error.stdout);
    }
}
