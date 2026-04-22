import type { TranslationKey } from '$lib/translations/translations';

export const BLOODBORNE_PATCH_FILE_NAME = 'Bloodborne.xml';
export const BLOODBORNE_PATCH_SUPPORTED_APP_VERSION = '01.09';

type BloodbornePatchNameKey = Extract<TranslationKey, `patch.${string}.name`>;
type BloodbornePatchNoteKey = Extract<TranslationKey, `patch.${string}.note`>;

export type BloodbornePatchDefinition = {
    id: string;
    metadataName: string;
    nameKey: BloodbornePatchNameKey;
    noteKey?: BloodbornePatchNoteKey;
};

export const BLOODBORNE_PATCHES = [
    { id: 'skip-intro', metadataName: 'Skip Intro', nameKey: 'patch.skip-intro.name' },
    {
        id: 'performance',
        metadataName: 'Performance Patch (perf increase)',
        nameKey: 'patch.performance.name',
        noteKey: 'patch.performance.note'
    },
    {
        id: 'disable-motion-blur',
        metadataName: 'Disable Motion Blur (perf increase)',
        nameKey: 'patch.disable-motion-blur.name',
        noteKey: 'patch.disable-motion-blur.note'
    },
    {
        id: 'disable-dynamic-light-shadows',
        metadataName: 'Disable Dynamic Light Shadows (perf increase)',
        nameKey: 'patch.disable-dynamic-light-shadows.name',
        noteKey: 'patch.disable-dynamic-light-shadows.note'
    },
    {
        id: 'disable-chromatic-aberration',
        metadataName: 'Disable Chromatic Aberration',
        nameKey: 'patch.disable-chromatic-aberration.name'
    },
    {
        id: 'disable-aa',
        metadataName: 'Disable AA',
        nameKey: 'patch.disable-aa.name',
        noteKey: 'patch.disable-aa.note'
    },
    {
        id: 'disable-dof',
        metadataName: 'Disable DoF',
        nameKey: 'patch.disable-dof.name',
        noteKey: 'patch.disable-dof.note'
    },
    {
        id: 'disable-ssao',
        metadataName: 'Disable SSAO',
        nameKey: 'patch.disable-ssao.name',
        noteKey: 'patch.disable-ssao.note'
    },
    {
        id: 'enable-ssr',
        metadataName: 'Enable Screen Space Reflections (READ NOTE)',
        nameKey: 'patch.enable-ssr.name',
        noteKey: 'patch.enable-ssr.note'
    },
    {
        id: 'text-scale-50',
        metadataName: '50% Text scale',
        nameKey: 'patch.text-scale-50.name',
        noteKey: 'patch.text-scale-50.note'
    },
    {
        id: 'fmod-crash-fix',
        metadataName: 'FMOD Crash Fix',
        nameKey: 'patch.fmod-crash-fix.name',
        noteKey: 'patch.fmod-crash-fix.note'
    },
    {
        id: 'model-lod-lowest',
        metadataName: 'Model LOD 2 (Lowest)',
        nameKey: 'patch.model-lod-lowest.name',
        noteKey: 'patch.model-lod-lowest.note'
    },
    {
        id: 'model-lod-lower',
        metadataName: 'Model LOD 1 (Lower)',
        nameKey: 'patch.model-lod-lower.name',
        noteKey: 'patch.model-lod-lower.note'
    },
    {
        id: 'model-lod-highest',
        metadataName: 'Model LOD -2 (Highest)',
        nameKey: 'patch.model-lod-highest.name',
        noteKey: 'patch.model-lod-highest.note'
    },
    {
        id: 'increased-graphics-heap-sizes',
        metadataName: 'Increased Graphics Heap Sizes',
        nameKey: 'patch.increased-graphics-heap-sizes.name',
        noteKey: 'patch.increased-graphics-heap-sizes.note'
    },
    {
        id: 'intel-12th-gen-sfx-workaround',
        metadataName: 'Intel 12th Gen+ SFX workaround',
        nameKey: 'patch.intel-12th-gen-sfx-workaround.name',
        noteKey: 'patch.intel-12th-gen-sfx-workaround.note'
    },
    {
        id: 'intel-black-tonemap-fix',
        metadataName: 'Intel Black Tonemap Fix',
        nameKey: 'patch.intel-black-tonemap-fix.name',
        noteKey: 'patch.intel-black-tonemap-fix.note'
    },
    {
        id: 'disable-http-requests',
        metadataName: 'Disable HTTP Requests',
        nameKey: 'patch.disable-http-requests.name'
    },
    {
        id: 'ds1-like-physics',
        metadataName: 'DS1-like physics',
        nameKey: 'patch.ds1-like-physics.name',
        noteKey: 'patch.ds1-like-physics.note'
    },
    {
        id: 'lower-object-corpse-physics',
        metadataName: 'Lower object/corpse physics',
        nameKey: 'patch.lower-object-corpse-physics.name',
        noteKey: 'patch.lower-object-corpse-physics.note'
    },
    {
        id: 'fps-30-plusplus',
        metadataName: '30 FPS++',
        nameKey: 'patch.fps-30-plusplus.name',
        noteKey: 'patch.fps-30-plusplus.note'
    },
    {
        id: 'fps-60-no-deltatime',
        metadataName: '60FPS (no deltatime)',
        nameKey: 'patch.fps-60-no-deltatime.name',
        noteKey: 'patch.fps-60-no-deltatime.note'
    },
    {
        id: 'fps-60-plusplus',
        metadataName: '60 FPS++',
        nameKey: 'patch.fps-60-plusplus.name',
        noteKey: 'patch.fps-60-plusplus.note'
    },
    {
        id: 'fps-90-plusplus',
        metadataName: '90 FPS++',
        nameKey: 'patch.fps-90-plusplus.name',
        noteKey: 'patch.fps-90-plusplus.note'
    },
    {
        id: 'uncap-fps-plusplus',
        metadataName: 'Uncap FPS++',
        nameKey: 'patch.uncap-fps-plusplus.name',
        noteKey: 'patch.uncap-fps-plusplus.note'
    },
    {
        id: 'restore-debug-menu',
        metadataName: 'Restore Debug Menu (READ NOTES)',
        nameKey: 'patch.restore-debug-menu.name',
        noteKey: 'patch.restore-debug-menu.note'
    },
    {
        id: 'disable-camera-auto-rotation',
        metadataName: 'Disable Camera Auto Rotation via Movement',
        nameKey: 'patch.disable-camera-auto-rotation.name',
        noteKey: 'patch.disable-camera-auto-rotation.note'
    },
    {
        id: 'increased-camera-distance',
        metadataName: 'Increased camera distance',
        nameKey: 'patch.increased-camera-distance.name',
        noteKey: 'patch.increased-camera-distance.note'
    },
    {
        id: 'no-rally-decay',
        metadataName: 'No Rally Decay',
        nameKey: 'patch.no-rally-decay.name',
        noteKey: 'patch.no-rally-decay.note'
    },
    {
        id: 'disable-rally',
        metadataName: 'Disable Rally (HP Regain)',
        nameKey: 'patch.disable-rally.name',
        noteKey: 'patch.disable-rally.note'
    },
    {
        id: 'player-no-dead',
        metadataName: 'Player No Dead (Read note)',
        nameKey: 'patch.player-no-dead.name',
        noteKey: 'patch.player-no-dead.note'
    },
    {
        id: 'player-stealth',
        metadataName: 'Player Stealth (Read note)',
        nameKey: 'patch.player-stealth.name',
        noteKey: 'patch.player-stealth.note'
    },
    {
        id: 'player-silent',
        metadataName: 'Player Silent (Read note)',
        nameKey: 'patch.player-silent.name',
        noteKey: 'patch.player-silent.note'
    },
    {
        id: 'sensitive-analog-input',
        metadataName: 'Sensitive Analog Input (easier to run)',
        nameKey: 'patch.sensitive-analog-input.name',
        noteKey: 'patch.sensitive-analog-input.note'
    },
    {
        id: 'unlock-game-region',
        metadataName: 'Unlock Game Region',
        nameKey: 'patch.unlock-game-region.name',
        noteKey: 'patch.unlock-game-region.note'
    },
    {
        id: 'bookmark-and-capture-outputs',
        metadataName: 'Bookmark and Capture outputs',
        nameKey: 'patch.bookmark-and-capture-outputs.name'
    },
    {
        id: 'enemy-control',
        metadataName: 'Enemy Control',
        nameKey: 'patch.enemy-control.name',
        noteKey: 'patch.enemy-control.note'
    },
    {
        id: 'light-grid-1280x800-steamdeck',
        metadataName: '1280x800 Light Grid For SteamDeck (READ NOTES)',
        nameKey: 'patch.light-grid-1280x800-steamdeck.name',
        noteKey: 'patch.light-grid-1280x800-steamdeck.note'
    },
    {
        id: 'light-grid-1080p',
        metadataName: '1080p Light Grid (READ NOTES)',
        nameKey: 'patch.light-grid-1080p.name',
        noteKey: 'patch.light-grid-1080p.note'
    },
    {
        id: 'light-grid-1440p',
        metadataName: '1440p Light Grid (READ NOTES)',
        nameKey: 'patch.light-grid-1440p.name',
        noteKey: 'patch.light-grid-1440p.note'
    },
    {
        id: 'light-grid-4k',
        metadataName: '4k Light Grid (READ NOTES)',
        nameKey: 'patch.light-grid-4k.name',
        noteKey: 'patch.light-grid-4k.note'
    },
    {
        id: 'optimal-1080p',
        metadataName: 'Optimal 1080p',
        nameKey: 'patch.optimal-1080p.name',
        noteKey: 'patch.optimal-1080p.note'
    },
    {
        id: 'resolution-640x360-16-9',
        metadataName: 'Resolution Patch 640x360 (16:9)',
        nameKey: 'patch.resolution-640x360-16-9.name',
        noteKey: 'patch.resolution-640x360-16-9.note'
    },
    {
        id: 'resolution-960x540-16-9',
        metadataName: 'Resolution Patch 960x540 (16:9)',
        nameKey: 'patch.resolution-960x540-16-9.name',
        noteKey: 'patch.resolution-960x540-16-9.note'
    },
    {
        id: 'resolution-1280x720-16-9',
        metadataName: 'Resolution Patch 1280x720 (16:9)',
        nameKey: 'patch.resolution-1280x720-16-9.name',
        noteKey: 'patch.resolution-1280x720-16-9.note'
    },
    {
        id: 'resolution-1440x810-16-9',
        metadataName: 'Resolution Patch 1440x810 (16:9)',
        nameKey: 'patch.resolution-1440x810-16-9.name',
        noteKey: 'patch.resolution-1440x810-16-9.note'
    },
    {
        id: 'resolution-1600x900-16-9',
        metadataName: 'Resolution Patch 1600x900 (16:9)',
        nameKey: 'patch.resolution-1600x900-16-9.name',
        noteKey: 'patch.resolution-1600x900-16-9.note'
    },
    {
        id: 'resolution-2560x1440-16-9',
        metadataName: 'Resolution Patch 2560x1440 (16:9)',
        nameKey: 'patch.resolution-2560x1440-16-9.name',
        noteKey: 'patch.resolution-2560x1440-16-9.note'
    },
    {
        id: 'resolution-3840x2160-16-9',
        metadataName: 'Resolution Patch 3840x2160 (16:9)',
        nameKey: 'patch.resolution-3840x2160-16-9.name',
        noteKey: 'patch.resolution-3840x2160-16-9.note'
    },
    {
        id: 'resolution-1280x800-16-10',
        metadataName: 'Resolution Patch 1280x800 (16:10)',
        nameKey: 'patch.resolution-1280x800-16-10.name',
        noteKey: 'patch.resolution-1280x800-16-10.note'
    },
    {
        id: 'resolution-1920x1200-16-10',
        metadataName: 'Resolution Patch 1920x1200 (16:10)',
        nameKey: 'patch.resolution-1920x1200-16-10.name',
        noteKey: 'patch.resolution-1920x1200-16-10.note'
    },
    {
        id: 'resolution-2560x1600-16-10',
        metadataName: 'Resolution Patch 2560x1600 (16:10)',
        nameKey: 'patch.resolution-2560x1600-16-10.name',
        noteKey: 'patch.resolution-2560x1600-16-10.note'
    },
    {
        id: 'resolution-2560x1080-21-9',
        metadataName: 'Resolution Patch 2560x1080 (21:9)',
        nameKey: 'patch.resolution-2560x1080-21-9.name',
        noteKey: 'patch.resolution-2560x1080-21-9.note'
    },
    {
        id: 'resolution-3440x1440-21-9',
        metadataName: 'Resolution Patch 3440x1440 (21:9)',
        nameKey: 'patch.resolution-3440x1440-21-9.name',
        noteKey: 'patch.resolution-3440x1440-21-9.note'
    },
    {
        id: 'resolution-5120x2160-21-9',
        metadataName: 'Resolution Patch 5120x2160 (21:9)',
        nameKey: 'patch.resolution-5120x2160-21-9.name',
        noteKey: 'patch.resolution-5120x2160-21-9.note'
    },
    {
        id: 'resolution-3840x1080-32-9',
        metadataName: 'Resolution Patch 3840x1080 (32:9)',
        nameKey: 'patch.resolution-3840x1080-32-9.name',
        noteKey: 'patch.resolution-3840x1080-32-9.note'
    },
    {
        id: 'resolution-5180x1440-32-9',
        metadataName: 'Resolution Patch 5180x1440 (32:9)',
        nameKey: 'patch.resolution-5180x1440-32-9.name',
        noteKey: 'patch.resolution-5180x1440-32-9.note'
    },
    {
        id: 'resolution-1280x960-4-3',
        metadataName: 'Resolution Patch 1280x960 (4:3)',
        nameKey: 'patch.resolution-1280x960-4-3.name',
        noteKey: 'patch.resolution-1280x960-4-3.note'
    }
] as const satisfies readonly BloodbornePatchDefinition[];

export type BloodbornePatchId = (typeof BLOODBORNE_PATCHES)[number]['id'];
type BloodbornePatchMetadataName = (typeof BLOODBORNE_PATCHES)[number]['metadataName'];

const BLOODBORNE_PATCH_AUTHORS_BY_METADATA_NAME = {
    'Skip Intro': 'illusion',
    'Performance Patch (perf increase)': 'Kyo',
    'Disable Motion Blur (perf increase)': 'Kyo',
    'Disable Dynamic Light Shadows (perf increase)': 'Kyo',
    'Disable Chromatic Aberration': 'illusion',
    'Disable AA': 'Kyo',
    'Disable DoF': 'Kyo',
    'Disable SSAO': 'Kyo',
    'Enable Screen Space Reflections (READ NOTE)': 'Kyo',
    '50% Text scale': 'Kyo',
    'FMOD Crash Fix': 'Dasaav',
    'Model LOD 2 (Lowest)': 'Kyo, auser1337',
    'Model LOD 1 (Lower)': 'Kyo, auser1337',
    'Model LOD -2 (Highest)': 'Kyo, auser1337',
    'Increased Graphics Heap Sizes': 'auser1337',
    'Intel 12th Gen+ SFX workaround': 'emoose',
    'Intel Black Tonemap Fix': 'Kyo',
    'Disable HTTP Requests': 'bloo',
    'DS1-like physics': 'Kyo',
    'Lower object/corpse physics': 'Kyo',
    '30 FPS++': 'Kyo',
    '60FPS (no deltatime)': 'Kyo',
    '60 FPS++': 'Kyo',
    '90 FPS++': 'Kyo',
    'Uncap FPS++': 'Lance McDonald (manfightdragon), Kyo',
    'Restore Debug Menu (READ NOTES)': 'Whitehawkx, auser1337',
    'Disable Camera Auto Rotation via Movement': 'Imedved, Kyo',
    'Increased camera distance': 'Kyo',
    'No Rally Decay': 'Kyo',
    'Disable Rally (HP Regain)': 'Kyo',
    'Player No Dead (Read note)': 'Kyo',
    'Player Stealth (Read note)': 'Kyo',
    'Player Silent (Read note)': 'Kyo',
    'Sensitive Analog Input (easier to run)': 'Kyo',
    'Unlock Game Region': 'Lance McDonald (manfightdragon), Kyo',
    'Bookmark and Capture outputs': 'Foxy Hooligans',
    'Enemy Control': 'stagvant',
    '1280x800 Light Grid For SteamDeck (READ NOTES)': 'Kyo',
    '1080p Light Grid (READ NOTES)': 'Kyo',
    '1440p Light Grid (READ NOTES)': 'Kyo',
    '4k Light Grid (READ NOTES)': 'Kyo',
    'Optimal 1080p': 'Kyo',
    'Resolution Patch 640x360 (16:9)': 'Kyo',
    'Resolution Patch 960x540 (16:9)': 'Kyo',
    'Resolution Patch 1280x720 (16:9)': 'Kyo',
    'Resolution Patch 1440x810 (16:9)': 'Kyo',
    'Resolution Patch 1600x900 (16:9)': 'Kyo',
    'Resolution Patch 2560x1440 (16:9)': 'Kyo',
    'Resolution Patch 3840x2160 (16:9)': 'Kyo',
    'Resolution Patch 1280x800 (16:10)': 'Kyo',
    'Resolution Patch 1920x1200 (16:10)': 'Kyo',
    'Resolution Patch 2560x1600 (16:10)': 'Kyo',
    'Resolution Patch 2560x1080 (21:9)': 'Kyo',
    'Resolution Patch 3440x1440 (21:9)': 'Kyo',
    'Resolution Patch 5120x2160 (21:9)': 'Kyo',
    'Resolution Patch 3840x1080 (32:9)': 'Kyo',
    'Resolution Patch 5180x1440 (32:9)': 'Kyo',
    'Resolution Patch 1280x960 (4:3)': 'Kyo'
} as const satisfies Record<BloodbornePatchMetadataName, string>;

const XML_ATTRIBUTE_QUOTE_PATTERN = /"/g;
const XML_METADATA_TAG_PATTERN = /<Metadata\b[\s\S]*?>/g;

export function isBloodbornePatchAppVersionSupported(appVersion: string | null): boolean {
    const normalizedAppVersion = appVersion?.trim();
    return normalizedAppVersion === BLOODBORNE_PATCH_SUPPORTED_APP_VERSION || normalizedAppVersion === '1.09';
}

export function isBloodbornePatchId(value: string): value is BloodbornePatchId {
    return BLOODBORNE_PATCHES.some((patch) => patch.id === value);
}

export function getBloodbornePatchById(patchId: BloodbornePatchId): (typeof BLOODBORNE_PATCHES)[number] {
    return BLOODBORNE_PATCHES.find((patch) => patch.id === patchId) ?? BLOODBORNE_PATCHES[0];
}

export function getBloodbornePatchByMetadataName(metadataName: string): (typeof BLOODBORNE_PATCHES)[number] | null {
    return BLOODBORNE_PATCHES.find((patch) => patch.metadataName === metadataName) ?? null;
}

export function getBloodbornePatchAuthor(patch: Pick<BloodbornePatchDefinition, 'metadataName'>): string | null {
    return BLOODBORNE_PATCH_AUTHORS_BY_METADATA_NAME[patch.metadataName as BloodbornePatchMetadataName] ?? null;
}

function escapeXmlAttributeValue(value: string): string {
    return value.replace(XML_ATTRIBUTE_QUOTE_PATTERN, '&quot;');
}

function readXmlAttributeValue(tag: string, attributeName: string): string | null {
    const match = new RegExp(`\\s${attributeName}="([^"]*)"`).exec(tag);
    return match?.[1] ?? null;
}

function setXmlAttributeValue(tag: string, attributeName: string, value: string): string {
    const attributePattern = new RegExp(`(\\s${attributeName}=")[^"]*(")`);
    if (attributePattern.test(tag)) {
        return tag.replace(attributePattern, `$1${escapeXmlAttributeValue(value)}$2`);
    }

    const closingToken = tag.endsWith('/>') ? '/>' : '>';
    return `${tag.slice(0, -closingToken.length)} ${attributeName}="${escapeXmlAttributeValue(value)}"${closingToken}`;
}

function resolvePatchMetadataNameSet(patchIds: readonly BloodbornePatchId[]): Set<string> {
    return new Set(patchIds.map((patchId) => getBloodbornePatchById(patchId).metadataName));
}

export function updateBloodbornePatchEnablement(
    xmlContent: string,
    enabledPatchIds: readonly BloodbornePatchId[],
    disabledPatchIds: readonly BloodbornePatchId[] = []
): string {
    const enabledPatchNameSet = resolvePatchMetadataNameSet(enabledPatchIds);
    const disabledPatchNameSet = resolvePatchMetadataNameSet(disabledPatchIds);

    return xmlContent.replace(XML_METADATA_TAG_PATTERN, (metadataTag) => {
        const patchName = readXmlAttributeValue(metadataTag, 'Name');
        if (!patchName) {
            return metadataTag;
        }

        if (enabledPatchNameSet.has(patchName)) {
            return setXmlAttributeValue(metadataTag, 'isEnabled', 'true');
        }

        if (disabledPatchNameSet.has(patchName)) {
            return setXmlAttributeValue(metadataTag, 'isEnabled', 'false');
        }

        return metadataTag;
    });
}
