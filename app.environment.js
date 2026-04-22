import path from 'node:path';
import { config as loadDotEnv } from 'dotenv';

const supportedPlatforms = new Set(['electron', 'web', 'mobile']);
const supportedSvelteKitAdapters = new Set(['static', 'node']);
const envFiles = ['.env', '.env.local'];

for (const envFile of envFiles) {
    loadDotEnv({
        path: path.resolve(process.cwd(), envFile),
        quiet: true,
        override: envFile.endsWith('.local')
    });
}

function resolveSupportedValue(name, value, supportedValues) {
    if (supportedValues.has(value)) {
        return value;
    }

    throw new Error(`Unsupported ${name}: ${value}`);
}

export function resolveAppPlatform() {
    return resolveSupportedValue('app platform', process.env.PLATFORM ?? 'electron', supportedPlatforms);
}

export function resolveSvelteKitAdapter() {
    return resolveSupportedValue(
        'SvelteKit adapter',
        process.env.SVELTEKIT_ADAPTER ?? 'static',
        supportedSvelteKitAdapters
    );
}

export function createPlatformPaths(
    platform = resolveAppPlatform(),
    svelteKitAdapter = resolveSvelteKitAdapter()
) {
    return {
        build: `.build/svelte/${svelteKitAdapter}`,
        dist: `.build/dist/${platform}`,
        release: `.build/release/${platform}`
    };
}

export function resolveAppEnvironment() {
    const platform = resolveAppPlatform();
    const svelteKitAdapter = resolveSvelteKitAdapter();

    if (platform !== 'web' && svelteKitAdapter === 'node') {
        throw new Error(
            `SvelteKit adapter "node" is currently only supported for PLATFORM=web, received PLATFORM=${platform}`
        );
    }

    return {
        platform,
        svelteKitAdapter,
        directories: createPlatformPaths(platform, svelteKitAdapter)
    };
}
