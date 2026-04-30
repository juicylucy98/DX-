import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/blob';

const ADMIN_HASH = 'e923913e6903f339fb75a725ee59ec8a678bb9f964412aafe92962750b4765a1';

export async function POST(req: NextRequest) {
  if (req.headers.get('Authorization')?.replace('Bearer ', '').trim() !== ADMIN_HASH) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }
  const settings = await getSettings();
  settings.open = !settings.open;
  await saveSettings(settings);
  return NextResponse.json({ success: true, settings });
}
