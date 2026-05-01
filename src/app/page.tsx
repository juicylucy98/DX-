'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SESSIONS = Array.from({ length: 9 }, (_, i) => i + 4);

export default function HomePage() {
  const router = useRouter();
  const [open, setOpen] = useState<boolean | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const loadSettings = async (attempt = 1) => {
    setFetchError(false);
    setOpen(null);
    try {
      const res = await fetch('/api/settings');
      const d = await res.json();
      setOpen(d.open);
    } catch {
      if (attempt < 3) {
        // Cold start 대응: 최대 3회 자동 재시도 (1.5초 간격)
        setTimeout(() => loadSettings(attempt + 1), 1500);
      } else {
        setFetchError(true);
      }
    }
  };

  useEffect(() => { loadSettings(1); }, []);

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f0f4f8' }}>
        <div className="survey-card text-center max-w-sm w-full">
          <p className="text-3xl mb-3">⚠️</p>
          <h2 className="text-lg font-bold mb-2 text-gray-700">서버 연결 중 오류가 발생했습니다</h2>
          <p className="text-sm text-gray-500 mb-4">잠시 후 다시 시도해주세요.</p>
          <button
            onClick={loadSettings}
            className="btn-primary"
            style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (open === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f8' }}>
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f0f4f8' }}>
        <div className="survey-card text-center max-w-sm w-full">
          <p className="text-3xl mb-3">🔒</p>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#2563eb' }}>설문이 마감되었습니다</h2>
          <p className="text-sm text-gray-500">현재 진행 중인 설문이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f8' }}>
      <header className="header-gradient text-white pt-8 pb-0 px-4 text-center shadow-lg overflow-hidden">
        <div className="max-w-2xl mx-auto relative">
          <p className="text-sm font-medium tracking-widest opacity-80 mb-2 uppercase">POSCO International</p>
          <h1 className="text-2xl font-bold mb-1">DX 리터러시 향상 교육</h1>
          <p className="text-base opacity-85 mb-4">만족도 조사</p>
          {/* 캐릭터 */}
          <div className="flex justify-center items-end mt-2">
            <img src="/포잉.png" alt="" className="w-24 h-24 object-contain opacity-95" style={{ marginBottom: '-4px' }} />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="survey-card">
          <h2 className="text-base font-bold text-center mb-6" style={{ color: '#2563eb' }}>
            수강하신 회차를 선택해주세요
          </h2>
          <div className="grid grid-cols-5 gap-2">
            {SESSIONS.map(n => (
              <button
                key={n}
                className="session-btn"
                onClick={() => router.push(`/survey/${n}`)}
              >
                {n}회차
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            관리자 로그인
          </Link>
        </div>
      </main>
    </div>
  );
}
