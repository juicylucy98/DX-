import { NextRequest, NextResponse } from 'next/server';
import { ghSaveResponses } from '@/lib/github-storage';
import { sendToSheets } from '@/lib/sheets';

const ADMIN_HASH = 'e923913e6903f339fb75a725ee59ec8a678bb9f964412aafe92962750b4765a1';

export async function POST(req: NextRequest) {
  if (req.headers.get('Authorization')?.replace('Bearer ', '').trim() !== ADMIN_HASH) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }
  try {
    // GitHub 데이터 직접 초기화 (에러 전파됨)
    await ghSaveResponses([]);
    // 구글 시트 초기화 (실패해도 무시)
    sendToSheets({ _type: 'clear' }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Clear error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
