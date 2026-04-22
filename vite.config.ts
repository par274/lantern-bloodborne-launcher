import path from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type PluginOption } from 'vite';
import electron, { type ElectronOptions } from 'vite-plugin-electron';
import { resolveAppEnvironment } from './app.environment.js';

function startElectron(startup: () => Promise<void> | void): void {
    delete process.env.ELECTRON_RUN_AS_NODE;
    void startup();
}

function reloadElectronRenderer(reload: () => void): void {
    void reload();
}

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
                        startElectron(startup);
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
                        reloadElectronRenderer(reload);
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
