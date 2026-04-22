import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import app from '../../app';

import appMeta from './app.meta';

const buildResourcesDir = path.resolve(process.cwd(), 'build');
const desktopFileName = `${appMeta.appId}.desktop`;
const metainfoFileName = `${appMeta.appId}.metainfo.xml`;

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function createDesktopEntry(): string {
	return [
		'[Desktop Entry]',
		'Version=1.0',
		'Type=Application',
		`Name=${app.appShortTitle}`,
		`Comment=${app.appTitle}`,
		`Exec=${app.name}`,
		`Icon=${appMeta.appId}`,
		'Terminal=false',
		'Categories=Game;Utility;',
		`StartupWMClass=${app.appShortTitle}`
	].join('\n');
}

function createMetainfoXml(): string {
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<component type="desktop-application">',
		`    <id>${escapeXml(appMeta.appId)}</id>`,
		'    <metadata_license>CC0-1.0</metadata_license>',
		`    <project_license>${escapeXml(app.license)}</project_license>`,
		`    <name>${escapeXml(app.appShortTitle)}</name>`,
		`    <summary>${escapeXml(app.appTitle)}</summary>`,
		`    <launchable type="desktop-id">${escapeXml(desktopFileName)}</launchable>`,
		'    <description>',
		`        <p>${escapeXml(app.appTitle)}</p>`,
		'    </description>',
		`    <url type="homepage">${escapeXml(app.github)}</url>`,
		'    <categories>',
		'        <category>Game</category>',
		'        <category>Utility</category>',
		'    </categories>',
		'</component>',
		''
	].join('\n');
}

export function syncBuildResources(): void {
	mkdirSync(buildResourcesDir, { recursive: true });
	writeFileSync(path.join(buildResourcesDir, desktopFileName), createDesktopEntry(), 'utf8');
	writeFileSync(path.join(buildResourcesDir, metainfoFileName), createMetainfoXml(), 'utf8');
}
