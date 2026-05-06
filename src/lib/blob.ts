import type { DXResponse, Settings } from './types';

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), '.local-data');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch { /* read-only filesystem (e.g. Vercel) — ignore */ }
}
function localRead<T>(filename: string): T[] {
  try {
    ensureDataDir();
    const fp = path.join(DATA_DIR, filename);
    if (!fs.existsSync(fp)) return [];
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch { return []; }
}
function localWrite(filename: string, data: unknown) {
  try {
    ensureDataDir();
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
  } catch { /* read-only filesystem — ignore */ }
}
function localReadOne<T>(filename: string, fallback: T): T {
  try {
    ensureDataDir();
    const fp = path.join(DATA_DIR, filename);
    if (!fs.existsSync(fp)) return fallback;
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch { return fallback; }
}

// ── Vercel Blob 헬퍼 ──────────────────────────────────────────
// 토큰에서 스토어 ID를 추출해 URL을 LIST 없이 직접 구성
// → Advanced Operations 소모 없이 GET(Simple Op)만으로 읽기 가능
function getBlobBaseUrl(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const match = token.match(/vercel_blob_rw_([^_]+)_/i);
  if (!match) return '';
  return `https://${match[1].toLowerCase()}.private.blob.vercel-storage.com`;
}

async function blobGet<T>(filename: string): Promise<T | null> {
  const baseUrl = getBlobBaseUrl();
  if (!baseUrl) return null;
  try {
    const res = await fetch(`${baseUrl}/${filename}`, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch { return null; }
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

// ── Responses ─────────────────────────────────────────────────
// 신규 구조: dx-responses.json 단일 파일에 배열로 통합 관리
// Advanced Op 사용: PUT 1회/제출 (구조 변경 전: PUT + LIST 多수)
// Simple Op 사용: GET 1회/조회 (무료 한도 10,000회)

async function migrateOldResponses(): Promise<DXResponse[]> {
  // 구버전(개별 파일) 데이터를 신버전(단일 파일)으로 마이그레이션 (1회만 실행)
  try {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'dx-response-' });
    if (blobs.length === 0) return [];

    const responses: DXResponse[] = [];
    for (const blob of blobs) {
      try {
        const res = await fetch(blob.url, {
          headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        });
        if (res.ok) responses.push(await res.json() as DXResponse);
      } catch { /* skip */ }
    }
    responses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 신규 단일 파일로 저장
    if (responses.length > 0) {
      await blobPut('dx-responses.json', responses);
      console.log(`[migration] ${responses.length}개 응답을 단일 파일로 통합 완료`);
    }
    return responses;
  } catch {
    return [];
  }
}

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

  // 현재 응답 목록 읽기(Simple Op) → 새 응답 추가 → 저장(Advanced Op 1회)
  const existing = await getAllResponses();
  existing.unshift(response);
  await blobPut('dx-responses.json', existing);
}

export async function getAllResponses(): Promise<DXResponse[]> {
  if (!USE_BLOB) return localRead<DXResponse>('responses.json');

  // 신규 단일 파일 조회 (Simple Op - Advanced Op 소모 없음)
  const responses = await blobGet<DXResponse[]>('dx-responses.json');
  if (responses !== null) return responses;

  // 단일 파일 없을 경우 → 구버전에서 마이그레이션 시도 (최초 1회)
  return await migrateOldResponses();
}

export async function clearResponses(): Promise<void> {
  if (!USE_BLOB) {
    localWrite('responses.json', []);
    return;
  }
  await blobPut('dx-responses.json', []);
}

// ── Settings ──────────────────────────────────────────────────
const DEFAULT_SETTINGS: Settings = { open: true };

export async function getSettings(): Promise<Settings> {
  if (!USE_BLOB) return localReadOne<Settings>('settings.json', DEFAULT_SETTINGS);

  // 직접 URL로 읽기 (Simple Op - Advanced Op 소모 없음)
  const settings = await blobGet<Settings>('dx-settings.json');
  return settings ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (!USE_BLOB) { localWrite('settings.json', settings); return; }
  await blobPut('dx-settings.json', settings);
}
