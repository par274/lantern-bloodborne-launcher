import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PARAM_SFO_MAGIC = Buffer.from([0x00, 0x50, 0x53, 0x46]);
const PARAM_SFO_ENTRY_SIZE = 16;
const PARAM_SFO_HEADER_SIZE = 20;
const PARAM_SFO_FORMAT_STRING = 0x0204;
const PARAM_SFO_FORMAT_UINT32 = 0x0404;

export interface ParamSfoEntry {
    key: string;
    format: number;
    length: number;
    maxLength: number;
    value: string | number | Buffer;
}

export interface ParamSfoRecord {
    entries: Record<string, ParamSfoEntry>;
}

export interface ParamSfoMetadata {
    title: string | null;
    titleId: string | null;
    contentId: string | null;
    appVer: string | null;
}

function readZeroTerminatedString(buffer: Buffer, offset: number): string {
    let cursor = offset;

    while (cursor < buffer.length && buffer[cursor] !== 0x00) {
        cursor += 1;
    }

    return buffer.toString('utf8', offset, cursor);
}

function normalizeMetadataString(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : null;
}

function readParamSfoValue(buffer: Buffer, offset: number, format: number, length: number, maxLength: number) {
    const safeLength = Math.max(0, Math.min(length, maxLength, buffer.length - offset));
    const rawValue = buffer.subarray(offset, offset + Math.max(0, Math.min(maxLength, buffer.length - offset)));

    if (format === PARAM_SFO_FORMAT_STRING) {
        return buffer.toString('utf8', offset, offset + safeLength).replace(/\0+$/u, '');
    }

    if (format === PARAM_SFO_FORMAT_UINT32) {
        if (rawValue.length < 4) {
            throw new Error('PARAM.SFO entry is too short to contain a uint32 value.');
        }

        return rawValue.readUInt32LE(0);
    }

    return rawValue;
}

export async function readParamSfo(filePath: string): Promise<ParamSfoRecord> {
    const buffer = await readFile(filePath);

    if (buffer.length < PARAM_SFO_HEADER_SIZE || !buffer.subarray(0, 4).equals(PARAM_SFO_MAGIC)) {
        throw new Error(`Invalid PARAM.SFO file: ${filePath}`);
    }

    const keyTableStart = buffer.readUInt32LE(8);
    const dataTableStart = buffer.readUInt32LE(12);
    const entryCount = buffer.readUInt32LE(16);

    const entries: Record<string, ParamSfoEntry> = {};

    for (let index = 0; index < entryCount; index += 1) {
        const entryOffset = PARAM_SFO_HEADER_SIZE + index * PARAM_SFO_ENTRY_SIZE;

        if (entryOffset + PARAM_SFO_ENTRY_SIZE > buffer.length) {
            throw new Error(`PARAM.SFO entry table is truncated: ${filePath}`);
        }

        const keyOffset = buffer.readUInt16LE(entryOffset);
        const format = buffer.readUInt16LE(entryOffset + 2);
        const length = buffer.readUInt32LE(entryOffset + 4);
        const maxLength = buffer.readUInt32LE(entryOffset + 8);
        const dataOffset = buffer.readUInt32LE(entryOffset + 12);

        const key = readZeroTerminatedString(buffer, keyTableStart + keyOffset);
        const value = readParamSfoValue(buffer, dataTableStart + dataOffset, format, length, maxLength);

        entries[key] = {
            key,
            format,
            length,
            maxLength,
            value
        };
    }

    return { entries };
}

export function resolveParamSfoPath(installPath: string): string {
    return path.join(installPath, 'sce_sys', 'param.sfo');
}

export async function readParamSfoMetadata(filePath: string): Promise<ParamSfoMetadata> {
    const { entries } = await readParamSfo(filePath);

    const title = typeof entries.TITLE?.value === 'string' ? entries.TITLE.value : null;
    const titleId = typeof entries.TITLE_ID?.value === 'string' ? entries.TITLE_ID.value : null;
    const contentId = typeof entries.CONTENT_ID?.value === 'string' ? entries.CONTENT_ID.value : null;
    const appVer = typeof entries.APP_VER?.value === 'string' ? entries.APP_VER.value : null;

    return {
        title: normalizeMetadataString(title),
        titleId: normalizeMetadataString(titleId)?.toUpperCase() ?? null,
        contentId: normalizeMetadataString(contentId),
        appVer: normalizeMetadataString(appVer)
    };
}

export async function readBloodborneParamSfoMetadata(installPath: string): Promise<ParamSfoMetadata> {
    return readParamSfoMetadata(resolveParamSfoPath(installPath));
}
