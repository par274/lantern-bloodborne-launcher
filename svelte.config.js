import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { resolveAppEnvironment } from './app.environment.js';

const appEnvironment = resolveAppEnvironment();

function createSvelteKitAdapter() {
    if (appEnvironment.svelteKitAdapter === 'node') {
        return adapterNode({
            out: appEnvironment.directories.build
        });
    }

    return adapterStatic({
        pages: appEnvironment.directories.build,
        assets: appEnvironment.directories.build
    });
}

const config = {
    preprocess: vitePreprocess(),
    compilerOptions: {
        runes: true
    },
    kit: {
        adapter: createSvelteKitAdapter(),
        alias: {
            $platform: 'src/platform'
        },
        paths: {
            relative: true
        }
    }
};

export default config;
