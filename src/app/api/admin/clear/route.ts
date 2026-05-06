import { NextRequest, NextResponse } from 'next/server';
import { clearResponses } from '@/lib/blob';
import { sendToSheets } from '@/lib/sheets';

const ADMIN_HASH = 'e923913e6903f339fb75a725ee59ec8a678bb9f964412aafe92962750b4765a1';

export async function POST(req: NextRequest) {
  if (req.headers.get('Authorization')?.replace('Bearer ', '').trim() !== ADMIN_HASH) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }
  try {
    await Promise.allSettled([
      clearResponses(),
      sendToSheets({ _type: 'clear' }),
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
