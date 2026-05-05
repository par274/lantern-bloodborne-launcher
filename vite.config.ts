import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption } from 'vite';
import electron, { type ElectronOptions } from 'vite-plugin-electron';

import { resolveAppEnvironment } from './app.environment.js';

let nativeHostProcess: ChildProcess | null = null;
let isStoppingNativeHost = false;

function isNativeDevMode(): boolean {
    return process.env.LANTERN_NATIVE_DEV === '1' || process.env.LANTERN_NATIVE_DEV === 'true';
}

function createProcessEnv(extraEnv: Record<string, string>): NodeJS.ProcessEnv {
    return Object.fromEntries(
        Object.entries({
            ...process.env,
            ...extraEnv
        }).filter(([, value]) => typeof value === 'string')
    ) as NodeJS.ProcessEnv;
}

function resolveElectronExecutablePath(): string {
    if (process.platform === 'win32') {
        return path.resolve('node_modules', 'electron', 'dist', 'electron.exe');
    }

    if (process.platform === 'darwin') {
        return path.resolve('node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron');
    }

    return path.resolve('node_modules', 'electron', 'dist', 'electron');
}

function stopNativeHost(): void {
    if (!nativeHostProcess || nativeHostProcess.killed) {
        return;
    }

    isStoppingNativeHost = true;
    nativeHostProcess.kill();
    nativeHostProcess = null;
}

function startNativeHost(): void {
    if (nativeHostProcess && !nativeHostProcess.killed) {
        return;
    }

    isStoppingNativeHost = false;
    const dotnetHomePath = path.resolve('.build', 'dotnet', 'home');
    const dotnetNugetPath = path.resolve('.build', 'dotnet', 'nuget');

    nativeHostProcess = spawn(
        'dotnet',
        ['run', '--project', 'native/host/LanternLauncherHost.csproj', '--configuration', 'Debug'],
        {
            env: createProcessEnv({
                AVALONIA_TELEMETRY_OPTOUT: '1',
                DOTNET_CLI_HOME: dotnetHomePath,
                LANTERN_DEV_APP_PATH: process.cwd(),
                LANTERN_DEV_ELECTRON_PATH: resolveElectronExecutablePath(),
                LANTERN_NATIVE_DEV: '1',
                NUGET_PACKAGES: dotnetNugetPath
            }),
            stdio: 'inherit'
        }
    );

    nativeHostProcess.once('error', (error) => {
        console.error(`Native host could not be started: ${error.message}`);
        nativeHostProcess = null;
    });

    nativeHostProcess.once('exit', (code, signal) => {
        nativeHostProcess = null;

        if (!isNativeDevMode() || isStoppingNativeHost) {
            return;
        }

        process.exit(code ?? (signal ? 1 : 0));
    });
}

function startElectronMain(startup: () => Promise<void> | void): void {
    delete process.env.ELECTRON_RUN_AS_NODE;

    if (isNativeDevMode()) {
        startNativeHost();
        return;
    }

    void startup();
}

function startElectronPreload(reload: () => void): void {
    if (isNativeDevMode()) {
        startNativeHost();
        return;
    }

    void reload();
}

process.once('exit', stopNativeHost);
process.once('SIGINT', () => {
    stopNativeHost();
    process.exit(130);
});

export default defineConfig(({ command }) => {
    const appEnvironment = resolveAppEnvironment();
    const isDev = command === 'serve';
    const isElectronPlatform = appEnvironment.platform === 'electron';

    const plugins: PluginOption[] = [
        tailwindcss(),
        sveltekit()
    ];

    if (isElectronPlatform) {
        const electronEntries: ElectronOptions[] = [
            {
                entry: 'src/platform/electron/main.ts',
                onstart: isDev
                    ? ({ startup }) => {
                        startElectronMain(startup);
                    }
                    : undefined,
                vite: {
                    build: {
                        outDir: appEnvironment.directories.dist,
                        emptyOutDir: true,
                        sourcemap: true,
                        minify: false,
                        rollupOptions: {
                            external: ['electron']
                        }
                    }
                }
            },
            {
                entry: 'src/platform/electron/preload.ts',
                onstart: isDev
                    ? ({ reload }) => {
                        startElectronPreload(reload);
                    }
                    : undefined,
                vite: {
                    build: {
                        outDir: appEnvironment.directories.dist,
                        emptyOutDir: false,
                        sourcemap: true,
                        minify: false,
                        lib: {
                            entry: 'src/platform/electron/preload.ts',
                            formats: ['cjs'],
                            fileName: () => 'preload.js'
                        },
                        rollupOptions: {
                            external: ['electron'],
                            output: {
                                format: 'cjs',
                                entryFileNames: 'preload.js',
                                esModule: false,
                                exports: 'auto' as const
                            }
                        }
                    }
                }
            }
        ];

        if (!isDev) {
            electronEntries.push({
                entry: 'src/platform/electron/config/index.ts',
                vite: {
                    build: {
                        outDir: appEnvironment.directories.dist,
                        emptyOutDir: false,
                        sourcemap: false,
                        minify: false,
                        lib: {
                            entry: 'src/platform/electron/config/index.ts',
                            formats: ['cjs'],
                            fileName: () => 'config.cjs'
                        },
                        rollupOptions: {
                            external: ['electron-builder'],
                            output: {
                                format: 'cjs',
                                entryFileNames: 'config.cjs',
                                exports: 'default' as const,
                                esModule: false
                            }
                        }
                    }
                }
            });
        }

        plugins.push(electron(electronEntries));
    }

    return {
        define: {
            __APP_PLATFORM__: JSON.stringify(appEnvironment.platform)
        },
        plugins,
        resolve: {
            alias: {
                $platform: path.resolve('src/platform')
            }
        },
        server: {
            port: 5173,
            strictPort: true
        }
    };
});
