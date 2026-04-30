import type { DXResponse, Settings } from './types';

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), '.local-data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function localRead<T>(filename: string): T[] {
  ensureDataDir();
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}
function localWrite(filename: string, data: unknown) {
  ensureDataDir();
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}
function localReadOne<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return fallback;
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

async function blobPut(filename: string, data: unknown) {
  const { put } = await import('@vercel/blob');
  await put(filename, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
async function blobList(prefix: string) {
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix });
  return blobs;
}
async function blobFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });
  return res.json() as Promise<T>;
}
async function blobDel(urls: string[]) {
  if (urls.length === 0) return;
  const { del } = await import('@vercel/blob');
  await del(urls);
}

// ── Responses ─────────────────────────────────────────────────
export async function saveResponse(data: Omit<DXResponse, 'id' | 'timestamp'>): Promise<void> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const response: DXResponse = {
    id: `${timestamp}-${random}`,
    timestamp: new Date(timestamp).toISOString(),
    ...data,
  };

  if (!USE_BLOB) {
    const existing = localRead<DXResponse>('responses.json');
    existing.unshift(response);
    localWrite('responses.json', existing);
    return;
  }
  await blobPut(`dx-response-${timestamp}-${random}.json`, response);
}

export async function getAllResponses(): Promise<DXResponse[]> {
  if (!USE_BLOB) return localRead<DXResponse>('responses.json');

  const blobs = await blobList('dx-response-');
  const responses: DXResponse[] = [];
  for (const blob of blobs) {
    try {
      responses.push(await blobFetch<DXResponse>(blob.url));
    } catch { /* skip */ }
  }
  return responses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ── Settings ──────────────────────────────────────────────────
const DEFAULT_SETTINGS: Settings = { open: true };

export async function getSettings(): Promise<Settings> {
  if (!USE_BLOB) return localReadOne<Settings>('settings.json', DEFAULT_SETTINGS);
  try {
    const blobs = await blobList('dx-settings');
    if (blobs.length === 0) return DEFAULT_SETTINGS;
    const latest = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
    return await blobFetch<Settings>(latest.url);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (!USE_BLOB) { localWrite('settings.json', settings); return; }
  try {
    const blobs = await blobList('dx-settings');
    if (blobs.length > 0) await blobDel(blobs.map(b => b.url));
  } catch { /* ignore */ }
  await blobPut('dx-settings.json', settings);
}
