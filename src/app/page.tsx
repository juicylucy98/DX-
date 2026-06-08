import Link from "next/link";
import Image from "next/image";

// =============================================================================
// 회차 정보 — 추후 회차/날짜 변경 시 이 배열만 수정하면 됩니다.
// 다른 페이지(설문 작성, 관리자 대시보드)에서도 동일한 데이터를 쓰려면
// 이 배열을 src/lib/sessions.ts 로 빼서 export 하시는 걸 권장드려요.
// =============================================================================
const SESSIONS = [
  { num: 12, date: "6/8" },
  { num: 13, date: "6/9" },
  { num: 14, date: "6/16" },
  { num: 15, date: "6/24" },
  { num: 16, date: "6/30" },
  { num: 17, date: "7/1" },
  { num: 18, date: "7/13" },
  { num: 19, date: "7/16" },
  { num: 20, date: "7/20" },
  { num: 21, date: "7/22" },
  { num: 22, date: "7/28" },
  { num: 23, date: "8/4 오전" },
  { num: 24, date: "8/4 오후" },
  { num: 25, date: "광양" },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* ───────────────────────────────────────────────────────── */}
        {/* 기존 페이지 상단(펭귄 마스코트 + 타이틀)이 있으면          */}
        {/* 이 자리에 그대로 가져다 두세요. 예시:                      */}
        {/* ───────────────────────────────────────────────────────── */}
        <header className="text-center mb-8">
          <Image
            src="/포잉.png"
            alt="포잉"
            width={120}
            height={120}
            className="mx-auto"
            priority
          />
          <h1 className="mt-4 text-2xl font-bold text-slate-800">
            DX 리터러시 향상 교육 만족도 조사
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            POSCO International · 조직문화혁신그룹
          </p>
        </header>

        {/* 회차 선택 카드 */}
        <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-center text-blue-500 font-semibold mb-6">
            수강하신 회차를 선택해주세요
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {SESSIONS.map(({ num, date }) => (
              <Link
                key={num}
                href={`/survey/${num}`}
                className="group flex flex-col items-center justify-center
                           bg-white rounded-xl border border-blue-100
                           py-3 px-4 shadow-sm
                           transition hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5
                           focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <span className="text-blue-500 font-semibold leading-tight">
                  {num}회차
                </span>
                <span className="mt-0.5 text-xs text-slate-400 leading-tight">
                  {date}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 관리자 링크 */}
        <div className="text-center mt-6">
          <a
            href="/admin"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            관리자 로그인
          </a>
        </div>
      </div>
    </main>
  );
}
