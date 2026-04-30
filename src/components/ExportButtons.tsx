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

  const exportPPT = async () => {
    const pptxgen = (await import('pptxgenjs')).default;
    const prs = new pptxgen();
    const GREEN = '00704a';
    const LIGHT = 'f0faf5';

    prs.layout = 'LAYOUT_WIDE';
    prs.defineLayout({ name: 'LAYOUT_WIDE', width: 13.33, height: 7.5 });

    // Slide 1: 표지
    const s1 = prs.addSlide();
    s1.background = { color: GREEN };
    s1.addText('POSCO International', { x: 0, y: 2.2, w: '100%', align: 'center', fontSize: 16, color: 'FFFFFF', bold: false });
    s1.addText('DX 리터러시 향상 교육\n만족도 조사 결과', { x: 0, y: 2.8, w: '100%', align: 'center', fontSize: 32, color: 'FFFFFF', bold: true });
    s1.addText('조직문화혁신그룹', { x: 0, y: 5.5, w: '100%', align: 'center', fontSize: 14, color: 'FFFFFF' });

    // Slide 2: 전체 현황
    const s2 = prs.addSlide();
    s2.addText('전체 현황', { x: 0.5, y: 0.3, w: 12, fontSize: 24, bold: true, color: GREEN });
    const stats = [
      ['총 응답수', data.allResponses.length + '건'],
      ['진행 회차', data.sessions.length + '회차'],
      ['교육 내용 평균', avgOf(data.allResponses, 'q2') + '점'],
      ['강사 평균', avgOf(data.allResponses, 'q3') + '점'],
      ['만족도 평균', avgOf(data.allResponses, 'q5') + '점'],
    ];
    stats.forEach(([label, val], i) => {
      const x = 0.5 + (i % 3) * 4.2;
      const y = 1.5 + Math.floor(i / 3) * 2.5;
      s2.addShape(prs.ShapeType.roundRect, { x, y, w: 3.8, h: 2.0, fill: { color: LIGHT }, line: { color: GREEN, width: 1 } });
      s2.addText(label, { x, y: y + 0.3, w: 3.8, align: 'center', fontSize: 13, color: '666666' });
      s2.addText(val, { x, y: y + 0.8, w: 3.8, align: 'center', fontSize: 28, bold: true, color: GREEN });
    });

    // Slide 3: 회차별 평균
    const s3 = prs.addSlide();
    s3.addText('회차별 평균 점수', { x: 0.5, y: 0.3, w: 12, fontSize: 24, bold: true, color: GREEN });
    const tblData = [
      [{ text: '회차', options: { bold: true, fill: { color: GREEN }, color: 'FFFFFF' } },
       { text: '응답수', options: { bold: true, fill: { color: GREEN }, color: 'FFFFFF' } },
       { text: '교육 내용(평균)', options: { bold: true, fill: { color: GREEN }, color: 'FFFFFF' } },
       { text: '강사(평균)', options: { bold: true, fill: { color: GREEN }, color: 'FFFFFF' } },
       { text: '만족도(평균)', options: { bold: true, fill: { color: GREEN }, color: 'FFFFFF' } }],
      ...data.sessions.map(s => [
        { text: s.session + '회차' }, { text: s.total + '명' },
        { text: s.avgQ2.toFixed(1) }, { text: s.avgQ3.toFixed(1) }, { text: s.avgQ5.toFixed(1) },
      ]),
    ];
    s3.addTable(tblData, { x: 0.5, y: 1.2, w: 12, colW: [2, 2, 2.7, 2.7, 2.6], fontSize: 13, align: 'center', border: { type: 'solid', color: 'DDDDDD', pt: 1 } });

    // Slide 4: 직급별 평균
    const s4 = prs.addSlide();
    s4.addText('직급별 평균 점수', { x: 0.5, y: 0.3, w: 12, fontSize: 24, bold: true, color: GREEN });
    const gradeMap = new Map<string, DXResponse[]>();
    for (const r of data.allResponses) {
      if (!gradeMap.has(r.grade)) gradeMap.set(r.grade, []);
      gradeMap.get(r.grade)!.push(r);
    }
    const gradeTbl = [
      [{ text: '직급', options: { bold: true, fill: { color: GREEN }, color: 'FFFFFF' } },
       { text: '응답수', options: { bold: true, fill: { color: GREEN }, color: 'FFFFFF' } },
       { text: '교육 내용(평균)', options: { bold: true, fill: { color: GREEN }, color: 'FFFFFF' } },
       { text: '강사(평균)', options: { bold: true, fill: { color: GREEN }, color: 'FFFFFF' } },
       { text: '만족도(평균)', options: { bold: true, fill: { color: GREEN }, color: 'FFFFFF' } }],
      ...Array.from(gradeMap.entries()).map(([grade, rs]) => [
        { text: grade }, { text: rs.length + '명' },
        { text: avgOf(rs, 'q2') }, { text: avgOf(rs, 'q3') }, { text: avgOf(rs, 'q5') },
      ]),
    ];
    s4.addTable(gradeTbl, { x: 0.5, y: 1.2, w: 12, colW: [2, 2, 2.7, 2.7, 2.6], fontSize: 13, align: 'center', border: { type: 'solid', color: 'DDDDDD', pt: 1 } });

    prs.writeFile({ fileName: 'DX교육_만족도결과.pptx' });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={exportExcel}
        className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-semibold text-white transition-colors"
        style={{ background: '#217346' }}>
        📊 엑셀 저장
      </button>
      <button onClick={exportPPT}
        className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-semibold text-white transition-colors"
        style={{ background: '#c43e1c' }}>
        📑 PPT 저장
      </button>
    </div>
  );
}
