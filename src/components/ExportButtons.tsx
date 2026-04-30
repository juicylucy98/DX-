'use client';
import type { AdminData, DXResponse } from '@/lib/types';

interface Props { data: AdminData; }

function avgOf(responses: DXResponse[], key: 'q2' | 'q3' | 'q5') {
  if (!responses.length) return '-';
  return (responses.reduce((s, r) => s + r[key], 0) / responses.length).toFixed(1);
}

export default function ExportButtons({ data }: Props) {

  const exportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // 1. 전체 요약
    const summary = [
      ['항목', '값'],
      ['총 응답수', data.allResponses.length],
      ['진행 회차', data.sessions.length],
      ['교육 내용 전체 평균', avgOf(data.allResponses, 'q2')],
      ['강사 전체 평균', avgOf(data.allResponses, 'q3')],
      ['만족도 전체 평균', avgOf(data.allResponses, 'q5')],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), '전체요약');

    // 2. 회차별 통계
    const sessionRows = [['회차', '응답수', '교육 내용(평균)', '강사(평균)', '만족도(평균)']];
    for (const s of data.sessions) {
      sessionRows.push([String(s.session) + '회차', String(s.total), s.avgQ2.toFixed(1), s.avgQ3.toFixed(1), s.avgQ5.toFixed(1)]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sessionRows), '회차별통계');

    // 3. 직급별 통계
    const gradeMap = new Map<string, DXResponse[]>();
    for (const r of data.allResponses) {
      if (!gradeMap.has(r.grade)) gradeMap.set(r.grade, []);
      gradeMap.get(r.grade)!.push(r);
    }
    const gradeRows = [['직급', '응답수', '교육 내용(평균)', '강사(평균)', '만족도(평균)']];
    for (const [grade, rs] of gradeMap) {
      gradeRows.push([grade, String(rs.length), avgOf(rs, 'q2'), avgOf(rs, 'q3'), avgOf(rs, 'q5')]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gradeRows), '직급별통계');

    // 4. 개별 응답
    const respRows = [['제출시간', '회차', '이름', '직급', '부서', 'Q2 교육 내용', 'Q3 강사', 'Q4 의견', 'Q5 만족도']];
    for (const r of data.allResponses) {
      respRows.push([
        new Date(r.timestamp).toLocaleString('ko-KR'),
        r.session + '회차', r.name, r.grade, r.department,
        String(r.q2), String(r.q3), r.q4 || '', String(r.q5),
      ]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(respRows), '개별응답');

    XLSX.writeFile(wb, 'DX교육_만족도결과.xlsx');
  };

  return (
    <button onClick={exportExcel}
      className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-semibold text-white transition-colors"
      style={{ background: '#217346' }}>
      📊 엑셀 저장
    </button>
  );
}
