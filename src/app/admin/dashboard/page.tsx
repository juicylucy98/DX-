'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminData, SessionAnalytics, DXResponse } from '@/lib/types';

function getSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const t = text;
  const pos = ['좋', '감사', '유익', '도움', '만족', '훌륭', '재미', '흥미', '쉽', '친절', '유용', '최고', '기대', '이해', '명확', '알기', '잘', '열정', '성실', '깔끔', '체계', '완벽', '최적', '실용', '효율', '좋았', '좋아', '고맙'];
  const neg = ['아쉽', '불만', '어렵', '부족', '개선', '힘들', '지루', '불편', '실망', '안 좋', '없었', '느렸', '빠르게', '너무 빠', '이해하기 어', '어려웠', '부족했', '더 필요', '보완'];
  const posScore = pos.filter(w => t.includes(w)).length;
  const negScore = neg.filter(w => t.includes(w)).length;
  if (posScore > negScore) return 'positive';
  if (negScore > posScore) return 'negative';
  return 'neutral';
}

function SentimentIcon({ sentiment }: { sentiment: 'positive' | 'negative' | 'neutral' }) {
  if (sentiment === 'positive') return <span title="긍정" style={{ fontSize: '1.1rem' }}>🟢😊</span>;
  if (sentiment === 'negative') return <span title="부정" style={{ fontSize: '1.1rem' }}>🔴😢</span>;
  return <span title="중립/불명확" style={{ fontSize: '1.1rem' }}>⚪🤔</span>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<number | 'all'>('all');
  const [toggling, setToggling] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');

  const getToken = useCallback(() => sessionStorage.getItem('adminToken') || '', []);

  const fetchData = useCallback(async () => {
    const token = getToken();
    if (!token) { router.replace('/admin'); return; }
    try {
      const res = await fetch('/api/admin/data', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { sessionStorage.removeItem('adminToken'); router.replace('/admin'); return; }
      setData(await res.json());
    } catch { setError('데이터를 불러오는 데 실패했습니다.'); }
    finally { setLoading(false); }
  }, [router, getToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await fetch('/api/admin/toggle', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
      await fetchData();
    } catch { setError('상태 변경 실패'); }
    finally { setToggling(false); }
  };

  const handleClear = async () => {
    if (!confirm('모든 응답 데이터를 삭제하시겠습니까? 되돌릴 수 없습니다.')) return;
    setClearing(true);
    try {
      await fetch('/api/admin/clear', { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
      await fetchData();
    } catch { setError('초기화 실패'); }
    finally { setClearing(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f8' }}>
      <p className="text-gray-400">로딩 중...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f8' }}>
      <p className="text-red-500">{error}</p>
    </div>
  );

  const avg = (key: 'avgQ2' | 'avgQ3' | 'avgQ5', sessions: SessionAnalytics[]) => {
    const total = sessions.reduce((s, r) => s + r.total, 0);
    if (total === 0) return '-';
    const sum = sessions.reduce((s, r) => s + r[key] * r.total, 0);
    return (Math.round(sum / total * 10) / 10).toFixed(1);
  };

  const displaySessions = activeSession === 'all'
    ? data.sessions
    : data.sessions.filter(s => s.session === activeSession);

  const displayResponses: DXResponse[] = activeSession === 'all'
    ? data.allResponses
    : data.allResponses.filter(r => r.session === activeSession);

  // 직급별 통계
  const gradeMap = new Map<string, DXResponse[]>();
  for (const r of displayResponses) {
    if (!gradeMap.has(r.grade)) gradeMap.set(r.grade, []);
    gradeMap.get(r.grade)!.push(r);
  }
  const gradeStats = Array.from(gradeMap.entries())
    .map(([grade, responses]) => ({
      grade,
      total: responses.length,
      avgQ2: (responses.reduce((s, r) => s + r.q2, 0) / responses.length),
      avgQ3: (responses.reduce((s, r) => s + r.q3, 0) / responses.length),
      avgQ5: (responses.reduce((s, r) => s + r.q5, 0) / responses.length),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f8' }}>
      <header className="header-gradient text-white py-5 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs opacity-75 tracking-widest uppercase">POSCO International</p>
            <h1 className="text-xl font-bold">DX 교육 만족도 관리자</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleClear} disabled={clearing}
              className="text-sm bg-red-500/80 hover:bg-red-500 text-white px-3 py-2 rounded-lg font-medium">
              {clearing ? '삭제 중...' : '데이터 초기화'}
            </button>
            <button onClick={() => { sessionStorage.removeItem('adminToken'); router.push('/'); }}
              className="text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg font-medium">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{error}</div>}

        {/* 설문 상태 토글 */}
        <div className="survey-card flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500">설문 상태</p>
            <p className="font-bold text-lg" style={{ color: data.settings.open ? '#166534' : '#991b1b' }}>
              {data.settings.open ? '진행중' : '마감'}
            </p>
          </div>
          <button onClick={handleToggle} disabled={toggling}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: data.settings.open ? '#fee2e2' : '#dcfce7', color: data.settings.open ? '#991b1b' : '#166534' }}>
            {toggling ? '...' : data.settings.open ? '마감하기' : '열기'}
          </button>
        </div>

        {/* 전체 요약 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: '총 응답', value: data.allResponses.length + '건' },
            { label: '진행 회차', value: data.sessions.length + '회차' },
            { label: 'Q2 교육 도움 평균', value: avg('avgQ2', data.sessions) + '점' },
            { label: 'Q3 강사 효과 평균', value: avg('avgQ3', data.sessions) + '점' },
            { label: 'Q5 전반 만족도 평균', value: avg('avgQ5', data.sessions) + '점' },
          ].map(({ label, value }) => (
            <div key={label} className="stat-card">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold" style={{ color: '#00704a' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* 회차별 탭 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="flex overflow-x-auto border-b border-gray-200">
            <button
              onClick={() => setActiveSession('all')}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap flex-shrink-0 ${activeSession === 'all' ? 'tab-active' : 'text-gray-500'}`}>
              전체 ({data.allResponses.length})
            </button>
            {data.sessions.map(s => (
              <button key={s.session}
                onClick={() => setActiveSession(s.session)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap flex-shrink-0 ${activeSession === s.session ? 'tab-active' : 'text-gray-500'}`}>
                {s.session}회차 ({s.total})
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* 회차별 평균 테이블 */}
            {displaySessions.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  {activeSession === 'all' ? '회차별 평균 점수' : `${activeSession}회차 통계`}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-3 py-2 text-gray-600 font-semibold rounded-tl-lg">회차</th>
                        <th className="text-center px-3 py-2 text-gray-600 font-semibold">응답수</th>
                        <th className="text-center px-3 py-2 text-gray-600 font-semibold">Q2 교육 도움 평균</th>
                        <th className="text-center px-3 py-2 text-gray-600 font-semibold">Q3 강사 효과 평균</th>
                        <th className="text-center px-3 py-2 text-gray-600 font-semibold rounded-tr-lg">Q5 전반 만족도 평균</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displaySessions.map(s => (
                        <tr key={s.session} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 font-semibold" style={{ color: '#00704a' }}>{s.session}회차</td>
                          <td className="px-3 py-2 text-center text-gray-600">{s.total}명</td>
                          <td className="px-3 py-2 text-center font-bold" style={{ color: '#00704a' }}>{s.avgQ2.toFixed(1)}</td>
                          <td className="px-3 py-2 text-center font-bold" style={{ color: '#00704a' }}>{s.avgQ3.toFixed(1)}</td>
                          <td className="px-3 py-2 text-center font-bold" style={{ color: '#00704a' }}>{s.avgQ5.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 직급별 통계 */}
            {gradeStats.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">직급별 평균 점수</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-3 py-2 text-gray-600 font-semibold rounded-tl-lg">직급</th>
                        <th className="text-center px-3 py-2 text-gray-600 font-semibold">응답수</th>
                        <th className="text-center px-3 py-2 text-gray-600 font-semibold">Q2 교육 도움 평균</th>
                        <th className="text-center px-3 py-2 text-gray-600 font-semibold">Q3 강사 효과 평균</th>
                        <th className="text-center px-3 py-2 text-gray-600 font-semibold rounded-tr-lg">Q5 전반 만족도 평균</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeStats.map(g => (
                        <tr key={g.grade} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 font-semibold text-gray-700">{g.grade}</td>
                          <td className="px-3 py-2 text-center text-gray-600">{g.total}명</td>
                          <td className="px-3 py-2 text-center font-bold" style={{ color: '#00704a' }}>{g.avgQ2.toFixed(1)}</td>
                          <td className="px-3 py-2 text-center font-bold" style={{ color: '#00704a' }}>{g.avgQ3.toFixed(1)}</td>
                          <td className="px-3 py-2 text-center font-bold" style={{ color: '#00704a' }}>{g.avgQ5.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 개별 응답 */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">개별 응답 ({displayResponses.length}건)</p>
              {displayResponses.length === 0 ? (
                <p className="text-sm text-gray-400">아직 응답이 없습니다.</p>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {displayResponses.map(r => (
                    <div key={r.id} className="bg-gray-50 rounded-xl p-4 text-sm">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-bold px-2 py-0.5 rounded-full text-xs text-white" style={{ background: '#00704a' }}>
                          {r.session}회차
                        </span>
                        <span className="font-semibold text-gray-700">{r.name}</span>
                        <span className="text-gray-500">{r.grade} · {r.department}</span>
                        <span className="text-gray-400 text-xs ml-auto">{new Date(r.timestamp).toLocaleString('ko-KR')}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-xs text-gray-400">Q2 교육 도움</p>
                          <p className="font-bold" style={{ color: '#00704a' }}>{r.q2}점</p>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-xs text-gray-400">Q3 강사 효과</p>
                          <p className="font-bold" style={{ color: '#00704a' }}>{r.q3}점</p>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <p className="text-xs text-gray-400">Q5 전반 만족도</p>
                          <p className="font-bold" style={{ color: '#00704a' }}>{r.q5}점</p>
                        </div>
                      </div>
                      {r.q4 && (
                        <div className="bg-white rounded-lg p-2 flex items-start gap-2">
                          <SentimentIcon sentiment={getSentiment(r.q4)} />
                          <p className="text-gray-600 text-xs">
                            <span className="font-semibold">Q4 의견:</span> {r.q4}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
