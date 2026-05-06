import { NextRequest, NextResponse } from 'next/server';

const ADMIN_HASH = 'e923913e6903f339fb75a725ee59ec8a678bb9f964412aafe92962750b4765a1';

export async function POST(req: NextRequest) {
  if (req.headers.get('Authorization')?.replace('Bearer ', '').trim() !== ADMIN_HASH) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 });
  }
  const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
  if (!USE_BLOB) {
    const fs = await import('fs');
    const path = await import('path');
    const fp = path.join(process.cwd(), '.local-data', 'responses.json');
    if (fs.existsSync(fp)) fs.writeFileSync(fp, '[]');
    return NextResponse.json({ success: true });
  }
  try {
    const { clearResponses } = await import('@/lib/blob');
    await clearResponses();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
