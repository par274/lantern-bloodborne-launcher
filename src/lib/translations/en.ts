import { createTranslationDictionary } from './createTranslationDictionary';
import type { TranslationDictionaryShape } from './tr';

export const enTree = {
    title: 'English',
    app: {
        version: 'App version {{version}}'
    },
    bloodborne: {
        meta: {
            titleLabel: 'Game Title',
            titleIdLabel: 'Title ID',
            contentIdLabel: 'Content ID',
            appVerLabel: 'Game Version'
        }
    },
    virtualKeyboard: {
        title: 'Virtual keyboard',
        space: 'Space',
        backspace: 'Backspace',
        clear: 'Clear',
        paste: 'Paste',
        done: 'Done'
    },
    splash: {
        eyebrow: 'LanternLauncher',
        title: 'Preparing launcher',
        loadingConfig: 'Checking launcher configuration',
        checkingSettings: 'Checking settings',
        checkingShadps4Availability: 'Checking shadPS4',
        preparingShadps4UserData: 'Preparing shadPS4 files',
        initializingShadps4Runtime: 'Starting shadPS4 silently for first-time setup',
        downloadingShadps4Patches: 'Downloading patches',
        checkingShadps4Release: 'Checking shadPS4 release version',
        preparingShadps4: 'Preparing shadPS4',
        downloadingShadps4: 'Downloading shadPS4',
        extractingShadps4: 'Extracting shadPS4 archive',
        finalizingShadps4: 'Finalizing shadPS4 setup',
        usingCachedShadps4: 'Using cached shadPS4 build',
        needsBloodbornePath: 'Select the Bloodborne folder to continue.',
        pickFolder: 'Select Bloodborne folder',
        selectedFolder: 'Selected folder',
        noFolderSelected: 'No folder has been selected yet.',
        allowedLabels: 'Valid title ids',
        invalidTitleId: 'The selected folder is not a valid Bloodborne title id.',
        missingEboot: 'The selected folder does not contain eboot.bin.',
        pathNotFound: 'The saved folder could not be found.',
        notDirectory: 'The selected path is not a folder.',
        openingMainMenu: 'Opening main menu',
        selectingFolder: 'Opening folder picker',
        validatingBloodbornePath: 'Validating Bloodborne folder',
        savingLauncherConfig: 'Saving launcher configuration',
        localeLabel: 'Language',
        validationReady: 'Bloodborne was found, preparing the main menu.',
        platformUnavailable: 'This screen only works inside Electron.',
        unexpectedError: 'An unexpected error occurred.'
    },
    menu: {
        main: {
            start: 'Start Game',
            savedGames: 'Saved Games',
            modManager: 'Mod Manager',
            exit: 'Exit'
        },
        system: {
            title: 'System Settings',
            general: {
                $: 'General',
                consoleLanguage: 'Console Language',
                discordRpc: 'Discord Rich Presence',
                trophyKey: 'Trophy Key',
                trophyPopupDisabled: 'Disable Trophy Popup',
                trophyPopupSide: 'Popup Position',
                trophyPopupDuration: 'Popup Duration',
                volume: 'Volume',
                deleteShaderCache: 'Delete Shader Cache'
            },
            graphics: {
                $: 'Graphics',
                presets: {
                    $: 'Preset',
                    ultraQuality: 'Ultra Quality',
                    quality: 'Quality',
                    performance: 'Performance',
                    ultraPerformance: 'Ultra Performance'
                },
                custom: {
                    $: 'Custom',
                    readbacks: 'Readbacks',
                    resolution: 'Resolution',
                    extraDmem: 'Extra DMEM',
                    pipelineCache: 'Pipeline Cache'
                },
                directMemoryAccess: 'Direct Memory Access'
            },
            patches: 'Patches',
            emulator: 'Emulator',
            controls: 'Controls',
            interface: 'Interface'
        },
        state: {
            active: 'Active',
            enabled: 'Enabled',
            disabled: 'Disabled',
            configured: 'Configured',
            notConfigured: 'Not configured',
            confirmDelete: 'Delete',
            cancel: 'Cancel',
            trophySide: {
                right: 'Right',
                left: 'Left',
                topLeft: 'Top left',
                topRight: 'Top right',
                bottomLeft: 'Bottom left',
                bottomRight: 'Bottom right'
            },
            consoleLanguage: {
                japanese: 'Japanese',
                englishUs: 'English (US)',
                french: 'French',
                spanish: 'Spanish',
                german: 'German',
                italian: 'Italian',
                dutch: 'Dutch',
                portuguesePt: 'Portuguese (Portugal)',
                russian: 'Russian',
                korean: 'Korean',
                chineseTraditional: 'Chinese (Traditional)',
                chineseSimplified: 'Chinese (Simplified)',
                finnish: 'Finnish',
                swedish: 'Swedish',
                danish: 'Danish',
                norwegian: 'Norwegian',
                polish: 'Polish',
                portugueseBr: 'Portuguese (Brazil)',
                englishGb: 'English (UK)',
                turkish: 'Turkish',
                spanishLa: 'Spanish (Latin America)',
                arabic: 'Arabic',
                frenchCa: 'French (Canada)',
                czech: 'Czech',
                hungarian: 'Hungarian',
                greek: 'Greek',
                romanian: 'Romanian',
                thai: 'Thai',
                vietnamese: 'Vietnamese',
                indonesian: 'Indonesian',
                ukrainian: 'Ukrainian'
            },
            readbacks: {
                relaxed: 'Relaxed'
            },
            resolution1080p: '1080p',
            resolution1440p: '1440p',
            resolution2160p: '2160p',
            extraDmem2048: '2048 MB',
            extraDmem4096: '4096 MB',
            extraDmem8196: '8196 MB',
            extraDmem12288: '12288 MB',
            extraDmem16384: '16384 MB'
        },
        description: {
            graphics: {
                presets: {
                    ultraQuality:
                        'Ultra Quality is a preset tuned for high-end systems. It targets 4K internal rendering and prioritizes sharpness, material clarity, and overall scene fidelity.',
                    quality:
                        'Quality is a preset tuned for upper mid-range systems. It targets 1440p internal rendering and aims for a balanced profile between image quality and performance.\n\nNote: For every preset except Ultra Quality, FSR sharpening stays enabled whenever the selected target is below your monitor resolution.',
                    performance:
                        'Performance is a preset tuned for entry to mid-range systems. It targets 1080p internal rendering and usually delivers a cleaner result than the original PS4 presentation.\n\nNote: For every preset except Ultra Quality, FSR sharpening stays enabled whenever the selected target is below your monitor resolution.',
                    ultraPerformance:
                        'Ultra Performance is a preset tuned for entry-level systems. It keeps a 1080p internal rendering target, but several scene effects are restricted for a lighter workload; in most cases the visual difference is still difficult to notice at a glance.\n\nNote: For every preset except Ultra Quality, FSR sharpening stays enabled whenever the selected target is below your monitor resolution.'
                },
                custom: {
                    $: 'Custom mode lets you step outside the predefined presets and choose your own rendering target, memory headroom, and shader-related behavior.',
                    readbacks:
                        'Readbacks control the post-processing quality path. Relaxed is the recommended default and usually gives the best balance for Bloodborne. When Relaxed is active, Vertex Explosion mode should remain disabled.',
                    resolution:
                        'Resolution sets the internal rendering target. In most cases, choosing the option closest to your monitor resolution will give the most consistent image.',
                    extraDmem:
                        'Extra DMEM gives the emulator more room to use additional data from system memory. Around 2048 MB is often enough for 1080p, while 4096 MB is usually sufficient for higher targets; larger values are best reserved for cases that genuinely need them.',
                    pipelineCache:
                        'Pipeline Cache stores compiled shaders on disk to reduce shader-compilation stutter during gameplay. It is usually best left enabled, but turning it off can make sense if you are running from a particularly slow HDD.'
                },
                directMemoryAccess:
                    'Direct Memory Access changes how the renderer reaches memory on the GPU side. It is usually unnecessary for standard Bloodborne play, but it can help both performance and visual stability in cases such as the Bloodborne Remaster mod.'
            },
            patches:
                'Manage Bloodborne patches. These patches are valid for game version 1.09 and can later be connected to preset-based recommendations.',
            emulator:
                'Review the active shadPS4 build, release channel, executable path, and GitHub source used by the launcher.',
            general:
                'Manage Bloodborne-specific shadPS4 settings, trophy notifications, volume, and shader cache.'
        }
    },
    generalSettings: {
        title: 'General Settings',
        description:
            'These settings are written to Bloodborne\'s custom config. They change behavior for this game without touching the global emulator profile.',
        consoleLanguage: {
            label: 'Console Language',
            description: 'Selected console language. This value will start the game in your chosen language if the game supports that language.'
        },
        discord: {
            label: 'Discord Rich Presence',
            description: 'Keeps Discord presence enabled while the game is running.'
        },
        trophy: {
            key: {
                label: 'Trophy Key',
                placeholder: 'ReleaseTrophyKey',
                prompt: 'Enter ReleaseTrophyKey',
                description: 'The trophy key is required for trophies to work in the game. You can copy and paste this key from your console.'
            },
            disablePopup: {
                label: 'Disable Trophy Popup',
                description: 'Disables the trophy notification popup window.'
            },
            duration: {
                label: 'Popup Duration',
                description: 'Controls how long the trophy popup stays visible, in milliseconds.'
            },
            side: {
                label: 'Popup Position',
                description: 'Controls where trophy notifications appear on screen.',
                right: 'Right',
                left: 'Left',
                topLeft: 'Top left',
                topRight: 'Top right',
                bottomLeft: 'Bottom left',
                bottomRight: 'Bottom right'
            }
        },
        volume: {
            label: 'Volume',
            description: 'Sets the volume percentage for the Bloodborne custom config. Maximum is 200, default is 100.'
        },
        shaderCache: {
            description: 'Deletes the contents of the shadPS4 cache folder. Shaders may be rebuilt on the next launch.',
            confirmTitle: 'Delete shader cache?',
            confirmMessage:
                'This will clear the shadPS4 shader cache folder. The game may rebuild shaders on the next launch, which can cause brief stutter during the first few minutes.'
        },
        units: {
            duration: 'ms'
        },
        actions: {
            save: 'Save',
            deleteShaderCache: 'Delete Shader Cache'
        },
        status: {
            loading: 'Reading settings',
            saving: 'Saving custom config',
            saved: 'Saved',
            deletingCache: 'Deleting shader cache',
            deletedCache: 'Shader cache deleted',
            failed: 'Action failed'
        }
    },
    emulator: {
        title: 'shadPS4 Emulator',
        eyebrow: 'Emulator Runtime',
        repository: 'Repository',
        update: {
            button: 'Update',
            checking: 'Checking GitHub...',
            complete: 'Update complete',
            failed: 'Update failed'
        },
        labels: {
            channel: 'Channel',
            version: 'Version',
            commit: 'Commit',
            executable: 'Executable',
            status: 'Status'
        },
        status: {
            available: 'Available',
            missing: 'Missing',
            unavailable: 'Unavailable'
        },
        valueUnavailable: 'Unavailable',
        description:
            'Lantern uses the selected shadPS4 channel when starting Bloodborne. Updating checks the latest release for the active channel and keeps the executable path synchronized with the launcher config.'
    },
    patch: {
        author: 'Author: {{author}}',
        update: {
            button: 'Update',
            channel: 'Channel: {{channel}}',
            idle: 'Ready',
            downloading: 'Downloading...',
            writing: 'Writing...',
            complete: 'Updated',
            failed: 'Update failed'
        },
        search: {
            placeholder: 'Search patches',
            clear: 'Clear',
            empty: 'No patches match this search.',
            emptyTitle: 'No results',
            emptyDescription: 'Try another keyword or clear the search field.'
        },
        descriptionUnavailable: 'No description is available for this patch yet.',
        'skip-intro': {
            name: 'Skip Intro'
        },
        performance: {
            name: 'Performance Patch',
            note: 'Modifies some of the game debug parameters for better performance. It may affect some visuals.'
        },
        'disable-motion-blur': {
            name: 'Disable Motion Blur',
            note: 'Disables the motion blur constructor. It also disables the velomap render and can improve performance.'
        },
        'disable-dynamic-light-shadows': {
            name: 'Disable Dynamic Light Shadows',
            note: 'Disables dynamic light shadows and reduces many heavy draw calls, which can improve performance.'
        },
        'disable-chromatic-aberration': {
            name: 'Disable Chromatic Aberration'
        },
        'disable-aa': {
            name: 'Disable AA',
            note: 'Disables the anti-aliasing constructor.'
        },
        'disable-dof': {
            name: 'Disable DoF',
            note: 'Disables depth of field.'
        },
        'disable-ssao': {
            name: 'Disable SSAO',
            note: 'Disables the screen space ambient occlusion constructor.'
        },
        'enable-ssr': {
            name: 'Enable Screen Space Reflections',
            note: 'This decreases performance, but enables screen space reflections for nicer reflections on reflective surfaces. The base game does not normally use this, but it can be enabled through debug functions.'
        },
        'text-scale-50': {
            name: '50% Text Scale',
            note: 'Makes text smaller and can look better at higher resolutions.\nOther values: 90%:6666663F, 80%:CDCC4C3F, 70%:3333333F, 60%:9A99193F, 50%:0000003F'
        },
        'fmod-crash-fix': {
            name: 'FMOD Crash Fix',
            note: 'May unintentionally prevent some sound playback.'
        },
        'model-lod-lowest': {
            name: 'Model LOD 2 Lowest',
            note: 'Lowest model detail. Improves performance but affects visuals.'
        },
        'model-lod-lower': {
            name: 'Model LOD 1 Lower',
            note: 'Slightly lower model detail. Improves performance but affects visuals.'
        },
        'model-lod-highest': {
            name: 'Model LOD -2 Highest',
            note: 'Highest model detail. Affects visuals and may be heavier.'
        },
        'increased-graphics-heap-sizes': {
            name: 'Increased Graphics Heap Sizes',
            note: 'Increases the graphics heap size, allowing more memory to be used. Must be used with increased DMEM. This is already included in resolution patches above 1080p, but is available separately for users who need it.'
        },
        'intel-12th-gen-sfx-workaround': {
            name: 'Intel 12th Gen+ SFX Workaround',
            note: 'Disables part of the SFX-related code to work around crashes on Windows with newer Intel chips.'
        },
        'intel-black-tonemap-fix': {
            name: 'Intel Black Tonemap Fix',
            note: 'Fixes black tonemap colors, most noticeably in DLC areas when using an Intel CPU.'
        },
        'disable-http-requests': {
            name: 'Disable HTTP Requests'
        },
        'ds1-like-physics': {
            name: 'DS1-like Physics',
            note: 'Allows corpses and some objects to be flung around more freely.'
        },
        'lower-object-corpse-physics': {
            name: 'Lower Object/Corpse Physics',
            note: 'Makes corpses resist movement from the player or other actions.'
        },
        'fps-30-plusplus': {
            name: '30 FPS++',
            note: 'Changes frame settings such as frame skip, vsync, and tearing. Helps improve input delay and response at 30 FPS.'
        },
        'fps-60-no-deltatime': {
            name: '60 FPS No Deltatime',
            note: 'Uses timesteps only, without deltatime. Cloth, corpses, and similar physics will not jump during lag or stutter, but game speed may slow down if you drop below 60 FPS.'
        },
        'fps-60-plusplus': {
            name: '60 FPS++',
            note: 'Changes frame settings such as frame skip, vsync, and tearing. Helps improve input delay and response at 60 FPS.'
        },
        'fps-90-plusplus': {
            name: '90 FPS++',
            note: 'Changes frame settings for 90 FPS and helps improve input delay and response. Remember to set vblank to 90 or higher.'
        },
        'uncap-fps-plusplus': {
            name: 'Uncap FPS++',
            note: 'Not generally recommended because timestep fixes may vary with fluctuating frame rates. Remember to increase vblank frequency.'
        },
        'restore-debug-menu': {
            name: 'Restore Debug Menu',
            note: 'Requires debug font files. It may crash without them. Access the menu by pressing the left side of the touchpad.'
        },
        'disable-camera-auto-rotation': {
            name: 'Disable Camera Auto Rotation via Movement',
            note: 'Disables automatic camera rotation while moving your character. Manual camera movement and lock-on still work.'
        },
        'increased-camera-distance': {
            name: 'Increased Camera Distance',
            note: 'Moves the player camera farther away from the character.'
        },
        'no-rally-decay': {
            name: 'No Rally Decay',
            note: 'Rally no longer decays.'
        },
        'disable-rally': {
            name: 'Disable Rally',
            note: 'Disables rally, also known as HP regain.'
        },
        'player-no-dead': {
            name: 'Player No Dead',
            note: 'You can take damage, but your HP will never drop below 1.'
        },
        'player-stealth': {
            name: 'Player Stealth',
            note: 'Enemies do not see or react to you unless attacked.'
        },
        'player-silent': {
            name: 'Player Silent',
            note: 'Enemies cannot hear you but can still see you.'
        },
        'sensitive-analog-input': {
            name: 'Sensitive Analog Input',
            note: 'Normally you walk until the analog stick is pushed around 90%. This lowers the threshold to roughly 70%, making it easier to run.'
        },
        'unlock-game-region': {
            name: 'Unlock Game Region',
            note: 'Unlocks the game region to support additional language options. It does not swap the X and Circle buttons.'
        },
        'bookmark-and-capture-outputs': {
            name: 'Bookmark and Capture Outputs'
        },
        'enemy-control': {
            name: 'Enemy Control',
            note: 'Press R3 to control the targeted enemy and L3 to go back.'
        },
        'light-grid-1280x800-steamdeck': {
            name: '1280x800 Light Grid for SteamDeck',
            note: 'Improves performance by lowering light grid draw calls. Use the version that matches your window or fullscreen resolution, not your render resolution patch.'
        },
        'light-grid-1080p': {
            name: '1080p Light Grid',
            note: 'Improves performance by lowering light grid draw calls. Use the version that matches your window or fullscreen resolution, not your render resolution patch. The 1080p light grid is also included in the performance patch.'
        },
        'light-grid-1440p': {
            name: '1440p Light Grid',
            note: 'Improves performance by lowering light grid draw calls. Use the version that matches your window or fullscreen resolution, not your render resolution patch.'
        },
        'light-grid-4k': {
            name: '4K Light Grid',
            note: 'Improves performance by lowering light grid draw calls. Use the version that matches your window or fullscreen resolution, not your render resolution patch.'
        },
        'optimal-1080p': {
            name: 'Optimal 1080p',
            note: 'Uses 360p globally with main renders at 1080p.'
        },
        'resolution-640x360-16-9': {
            name: 'Resolution 640x360 16:9',
            note: '640x360 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates.'
        },
        'resolution-960x540-16-9': {
            name: 'Resolution 960x540 16:9',
            note: '960x540 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates.'
        },
        'resolution-1280x720-16-9': {
            name: 'Resolution 1280x720 16:9',
            note: '1280x720 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates.'
        },
        'resolution-1440x810-16-9': {
            name: 'Resolution 1440x810 16:9',
            note: '1440x810 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates.'
        },
        'resolution-1600x900-16-9': {
            name: 'Resolution 1600x900 16:9',
            note: '1600x900 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates.'
        },
        'resolution-2560x1440-16-9': {
            name: 'Resolution 2560x1440 16:9',
            note: '2560x1440 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates. Remember to increase DMEM by around +8000 MB in game-specific settings.'
        },
        'resolution-3840x2160-16-9': {
            name: 'Resolution 3840x2160 16:9',
            note: '3840x2160 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates. Remember to increase DMEM by around +8000 MB in game-specific settings.'
        },
        'resolution-1280x800-16-10': {
            name: 'Resolution 1280x800 16:10',
            note: '1280x800 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates.'
        },
        'resolution-1920x1200-16-10': {
            name: 'Resolution 1920x1200 16:10',
            note: '1920x1200 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates. Remember to increase DMEM by around +8000 MB in game-specific settings.'
        },
        'resolution-2560x1600-16-10': {
            name: 'Resolution 2560x1600 16:10',
            note: '2560x1600 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates. Remember to increase DMEM by around +8000 MB in game-specific settings.'
        },
        'resolution-2560x1080-21-9': {
            name: 'Resolution 2560x1080 21:9',
            note: '2560x1080 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates. Remember to increase DMEM by around +8000 MB in game-specific settings.'
        },
        'resolution-3440x1440-21-9': {
            name: 'Resolution 3440x1440 21:9',
            note: '3440x1440 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates. Remember to increase DMEM by around +8000 MB in game-specific settings.'
        },
        'resolution-5120x2160-21-9': {
            name: 'Resolution 5120x2160 21:9',
            note: '5120x2160 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates. Remember to increase DMEM by around +8000 MB in game-specific settings.'
        },
        'resolution-3840x1080-32-9': {
            name: 'Resolution 3840x1080 32:9',
            note: '3840x1080 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates. Remember to increase DMEM by around +8000 MB in game-specific settings.'
        },
        'resolution-5180x1440-32-9': {
            name: 'Resolution 5180x1440 32:9',
            note: '5180x1440 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates. Remember to increase DMEM by around +8000 MB in game-specific settings.'
        },
        'resolution-1280x960-4-3': {
            name: 'Resolution 1280x960 4:3',
            note: '1280x960 resolution patch with corrected lock-on, enemy, and ally HP bar coordinates.'
        }
    },
    prompt: {
        select: 'Select',
        back: 'Back'
    }
} as const;

export const en = createTranslationDictionary(enTree) satisfies TranslationDictionaryShape;
