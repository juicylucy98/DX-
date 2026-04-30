import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const ADMIN_HASH = 'e923913e6903f339fb75a725ee59ec8a678bb9f964412aafe92962750b4765a1';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const hash = createHash('sha256').update(password).digest('hex');
  if (hash === ADMIN_HASH) {
    return NextResponse.json({ token: ADMIN_HASH });
  }
  return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
}
