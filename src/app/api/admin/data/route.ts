import { NextRequest, NextResponse } from 'next/server';
import { getAllResponses, getSettings } from '@/lib/blob';
import type { SessionAnalytics } from '@/lib/types';

const ADMIN_HASH = 'e923913e6903f339fb75a725ee59ec8a678bb9f964412aafe92962750b4765a1';

function authenticate(req: NextRequest) {
  return req.headers.get('Authorization')?.replace('Bearer ', '').trim() === ADMIN_HASH;
}

export async function GET(req: NextRequest) {
  if (!authenticate(req)) return NextResponse.json({ error: '인증 필요' }, { status: 401 });

  const [settings, allResponses] = await Promise.all([getSettings(), getAllResponses()]);

  const sessionMap = new Map<number, typeof allResponses>();
  for (const r of allResponses) {
    if (!sessionMap.has(r.session)) sessionMap.set(r.session, []);
    sessionMap.get(r.session)!.push(r);
  }

  const sessions: SessionAnalytics[] = Array.from(sessionMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([session, responses]) => {
      const avg = (key: 'q2' | 'q3' | 'q5') =>
        responses.length > 0
          ? Math.round((responses.reduce((s, r) => s + r[key], 0) / responses.length) * 10) / 10
          : 0;
      return { session, total: responses.length, avgQ2: avg('q2'), avgQ3: avg('q3'), avgQ5: avg('q5'), responses };
    });

  return NextResponse.json({ settings, sessions, allResponses });
}
