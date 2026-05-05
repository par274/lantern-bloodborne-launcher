import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteEntry = path.join(rootDirectory, 'node_modules', 'vite', 'bin', 'vite.js');

function createProcessEnv(extraEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = {};

    for (const [key, value] of Object.entries({ ...process.env, ...extraEnv })) {
        if (typeof value === 'string') {
            env[key] = value;
        }
    }

    return env;
}

const devProcess: ChildProcess = spawn(process.execPath, [viteEntry], {
    cwd: rootDirectory,
    env: createProcessEnv({
        LANTERN_NATIVE_DEV: '1'
    }),
    stdio: 'inherit',
    windowsHide: false
});

devProcess.once('error', (error) => {
    console.error(`Native dev server could not be started: ${error.message}`);
    process.exit(1);
});

devProcess.once('exit', (code, signal) => {
    if (signal) {
        process.exit(1);
        return;
    }

    process.exit(code ?? 0);
});

for (const signal of ['SIGINT', 'SIGTERM'] satisfies NodeJS.Signals[]) {
    process.once(signal, () => {
        if (!devProcess.killed) {
            devProcess.kill(signal);
        }
    });
}
