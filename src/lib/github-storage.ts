import type { DXResponse, Settings } from './types';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_DATA_REPO || 'juicylucy98/dx-survey-data';
const API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/contents`;

export const USE_GITHUB = !!GITHUB_TOKEN;

// ── 내부 헬퍼 ─────────────────────────────────────────────────

interface GhFile<T> { data: T; sha: string }

async function ghGet<T>(filename: string): Promise<GhFile<T> | null> {
  if (!USE_GITHUB) return null;
  try {
    const res = await fetch(`${API_BASE}/${filename}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      // next.js 캐시 우회 — 항상 최신 SHA 필요
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const content = Buffer.from(json.content as string, 'base64').toString('utf-8');
    return { data: JSON.parse(content) as T, sha: json.sha as string };
  } catch { return null; }
}

async function ghPut(filename: string, data: unknown, sha?: string): Promise<boolean> {
  if (!USE_GITHUB) return false;
  try {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const body: Record<string, unknown> = {
      message: `Update ${filename}`,
      content,
      ...(sha ? { sha } : {}),
    };
    const res = await fetch(`${API_BASE}/${filename}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch { return false; }
}

// ── Responses ─────────────────────────────────────────────────

export async function ghGetResponses(): Promise<DXResponse[] | null> {
  const result = await ghGet<DXResponse[]>('responses.json');
  return result ? result.data : null;
}

/**
 * 현재 GitHub 파일을 읽어 SHA를 얻은 뒤 덮어씀.
 * 동시 요청 충돌 시 실패할 수 있지만, Blob이 primary이므로 허용.
 */
export async function ghSaveResponses(responses: DXResponse[]): Promise<void> {
  const existing = await ghGet<DXResponse[]>('responses.json');
  await ghPut('responses.json', responses, existing?.sha);
}

// ── Settings ──────────────────────────────────────────────────

export async function ghGetSettings(): Promise<Settings | null> {
  const result = await ghGet<Settings>('settings.json');
  return result ? result.data : null;
}

export async function ghSaveSettings(settings: Settings): Promise<void> {
  const existing = await ghGet<Settings>('settings.json');
  await ghPut('settings.json', settings, existing?.sha);
}
