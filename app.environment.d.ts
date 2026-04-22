export type AppPlatform = 'electron' | 'web' | 'mobile';
export type SvelteKitAdapterKind = 'static' | 'node';

export interface PlatformDirectories {
    build: string;
    dist: string;
    release: string;
}

export interface AppEnvironment {
    platform: AppPlatform;
    svelteKitAdapter: SvelteKitAdapterKind;
    directories: PlatformDirectories;
}

export function resolveAppPlatform(): AppPlatform;
export function resolveSvelteKitAdapter(): SvelteKitAdapterKind;
export function createPlatformPaths(platform?: AppPlatform, svelteKitAdapter?: SvelteKitAdapterKind): PlatformDirectories;
export function resolveAppEnvironment(): AppEnvironment;
