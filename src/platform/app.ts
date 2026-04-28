interface App {
    name: string,
    appShortTitle: string,
    appTitle: string,
    appVer: string,
    buildTitle: string,
    copyright: string,
    license: string,
    github: string,
    defaults: {
        lang: string;
    };
};

const app: App = {
    name: 'lantern-bloodborne-launcher',
    appShortTitle: 'LanternLauncher',
    appTitle: 'LanternLauncher for Bloodborne shadPS4 emu.',
    appVer: '0.0.6',
    buildTitle: 'Early Access Build',
    copyright: 'Copyright (c) 2026 par274',
    license: 'GPL-2.0',
    github: 'https://github.com/par274/lantern-bloodborne-launcher',
    defaults: {
        lang: 'en'
    }
};

export default app;
