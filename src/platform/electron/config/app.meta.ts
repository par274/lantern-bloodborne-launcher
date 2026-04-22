import app from '../../app';

interface AppMeta {
    appId: string;
    productName: string;
    copyright: string;
    title: string;
}

const appMeta: AppMeta = {
    appId: 'com.parworks.lanternlauncher',
    productName: app.appShortTitle,
    copyright: app.copyright,
    title: app.appTitle
};

export default appMeta;
