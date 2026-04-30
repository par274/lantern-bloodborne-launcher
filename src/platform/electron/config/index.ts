import type { Configuration } from 'electron-builder';

import appMeta from './app.meta';
import { syncBuildResources } from './syncBuildResources';
import { prepareNativeLayeredArtifacts, wrapNativeLayeredBuild } from './wrapNativeLayeredBuild';

type SupportedPlatform = 'win32' | 'linux' | 'darwin';
type SupportedArch = 'x64' | 'arm64';
const buildResourceDir = 'build';

const platformIcons = {
    win: { icon: `${buildResourceDir}/icon.ico` },
    mac: { icon: `${buildResourceDir}/icon.icns` },
    linux: { icon: `${buildResourceDir}/icon.png` }
} as const;

function resolveTargetPlatform(): SupportedPlatform {
    const explicit = process.env.BUILD_TARGET_PLATFORM;

    if (explicit === 'win32' || explicit === 'linux' || explicit === 'darwin') {
        return explicit;
    }

    if (process.argv.includes('--win')) {
        return 'win32';
    }

    if (process.argv.includes('--linux')) {
        return 'linux';
    }

    if (process.argv.includes('--mac')) {
        return 'darwin';
    }

    if (process.platform === 'win32' || process.platform === 'linux' || process.platform === 'darwin') {
        return process.platform;
    }

    throw new Error(`Unsupported build platform: ${process.platform}`);
}

function resolveTargetArch(platform: SupportedPlatform): SupportedArch {
    const explicit = process.env.BUILD_TARGET_ARCH;

    if (explicit === 'x64' || explicit === 'arm64') {
        return explicit;
    }

    if (process.argv.includes('--arm64')) {
        return 'arm64';
    }

    if (process.argv.includes('--x64')) {
        return 'x64';
    }

    if (platform === 'win32') {
        return 'x64';
    }

    if (platform === 'linux') {
        return process.arch === 'arm64' ? 'arm64' : 'x64';
    }

    if (platform === 'darwin') {
        return process.arch === 'x64' ? 'x64' : 'arm64';
    }

    throw new Error(`Unsupported build architecture for ${platform}`);
}

const activePlatform = resolveTargetPlatform();
const activeArch = resolveTargetArch(activePlatform);

const baseConfig: Configuration = {
    appId: appMeta.appId,
    productName: appMeta.productName,
    copyright: appMeta.copyright,
    icon: platformIcons.linux.icon,
    beforeBuild: async () => {
        syncBuildResources();
        return false;
    },
    beforePack: prepareNativeLayeredArtifacts,
    directories: {
        buildResources: buildResourceDir,
        output: '.build/release/electron'
    },
    afterAllArtifactBuild: wrapNativeLayeredBuild,
    files: [
        '.build/svelte/static/**/*',
        '.build/dist/electron/**/*',
        '!.build/dist/electron/config.cjs'
    ],
    asar: true,
    compression: 'maximum',
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}'
};

const localConfig: Configuration = {
    ...baseConfig,
    win: {
        ...platformIcons.win,
        verifyUpdateCodeSignature: false,
        target: [{ target: 'dir', arch: [activeArch] }]
    },
    mac: {
        ...platformIcons.mac,
        target: [
            { target: 'dmg', arch: [activeArch] }
        ],
        category: 'public.app-category.utilities'
    },
    linux: {
        ...platformIcons.linux,
        target: [
            { target: 'AppImage', arch: [activeArch] }
        ],
        category: 'Utility'
    }
};

const ciConfig: Configuration = {
    ...baseConfig,
    win: {
        ...platformIcons.win,
        target: [{ target: 'dir', arch: [activeArch] }]
    },
    mac: {
        ...platformIcons.mac,
        target: [{ target: 'dir', arch: [activeArch] }]
    },
    linux: {
        ...platformIcons.linux,
        target: [{ target: 'dir', arch: [activeArch] }]
    }
};

const script = process.env.npm_lifecycle_event ?? '';

let selectedConfig: Configuration = baseConfig;

if (script.includes(':ci')) {
    selectedConfig = ciConfig;
} else if (script.includes(':portable')) {
    selectedConfig = localConfig;
}

export default selectedConfig;
