import { NextRequest, NextResponse } from 'next/server';
import { ghGetResponses } from '@/lib/github-storage';
import { sendToSheets } from '@/lib/sheets';

const ADMIN_HASH = 'e923913e6903f339fb75a725ee59ec8a678bb9f964412aafe92962750b4765a1';

export async function POST(req: NextRequest) {
  if (req.headers.get('Authorization')?.replace('Bearer ', '').trim() !== ADMIN_HASH) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }

  try {
    const responses = await ghGetResponses();
    if (!responses || responses.length === 0) {
      return NextResponse.json({ success: true, synced: 0 });
    }

    // GitHub에 저장된 모든 응답을 Google Sheets로 전송
    const results = await Promise.allSettled(
      responses.map(r =>
        sendToSheets({ ...r, _type: 'dx', timestamp: r.timestamp ?? new Date().toISOString() })
      )
    );

    const synced = results.filter(r => r.status === 'fulfilled').length;
    return NextResponse.json({ success: true, synced, total: responses.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
