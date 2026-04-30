import { NextRequest, NextResponse } from 'next/server';
import { saveResponse, getSettings } from '@/lib/blob';

export async function POST(req: NextRequest) {
  try {
    console.log('[submit] USE_BLOB:', !!process.env.BLOB_READ_WRITE_TOKEN, 'token prefix:', process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 10));
    const settings = await getSettings();
    if (!settings.open) {
      return NextResponse.json({ error: '설문이 마감되었습니다.' }, { status: 403 });
    }

    const body = await req.json();
    const { session, name, grade, department, q2, q3, q4, q5 } = body;

    if (!session || session < 1 || session > 30) {
      return NextResponse.json({ error: '올바른 회차를 선택해주세요.' }, { status: 400 });
    }
    if (!name?.trim() || !grade?.trim() || !department?.trim()) {
      return NextResponse.json({ error: '성명, 직급, 부서를 모두 입력해주세요.' }, { status: 400 });
    }
    if (!q2 || !q3 || !q5) {
      return NextResponse.json({ error: '모든 점수 항목을 선택해주세요.' }, { status: 400 });
    }

    await saveResponse({
      session: Number(session),
      name: name.trim(),
      grade: grade.trim(),
      department: department.trim(),
      q2: Number(q2),
      q3: Number(q3),
      q4: q4 || '',
      q5: Number(q5),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Submit error:', msg);
    return NextResponse.json({ error: `서버 오류: ${msg}` }, { status: 500 });
  }
}
