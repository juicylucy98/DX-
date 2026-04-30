'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const Q2_OPTIONS = ['매우 그렇다', '그렇다', '보통이다', '아니다', '매우 아니다'];
const Q3_OPTIONS = ['매우 그렇다', '그렇다', '보통이다', '아니다', '매우 아니다'];
const Q5_OPTIONS = ['매우 만족', '만족', '보통', '불만족', '매우 불만족'];

function RadioGroup({
  label,
  questionNum,
  options,
  value,
  onChange,
}: {
  label: React.ReactNode;
  questionNum: string;
  options: string[];
  value: number;
  onChange: (v: number) => void;
}) {
  const scores = [5, 4, 3, 2, 1];
  return (
    <div className="survey-card mb-5">
      <h2 className="text-sm font-bold mb-4" style={{ color: '#00704a' }}>
        {questionNum} {label}
      </h2>
      <div className="flex justify-between gap-1">
        {options.map((opt, i) => (
          <label key={i} className="radio-option flex-1">
            <input
              type="radio"
              name={questionNum}
              checked={value === scores[i]}
              onChange={() => onChange(scores[i])}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function SurveyPage() {
  const router = useRouter();
  const params = useParams();
  const session = Number(params.session);

  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [department, setDepartment] = useState('');
  const [q2, setQ2] = useState(0);
  const [q3, setQ3] = useState(0);
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session || session < 1 || session > 30) router.replace('/');
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !grade.trim() || !department.trim()) {
      setError('성명, 직급, 부서를 모두 입력해주세요.');
      return;
    }
    if (q2 === 0 || q3 === 0 || q5 === 0) {
      setError('모든 점수 항목을 선택해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, name, grade, department, q2, q3, q4, q5 }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '제출 실패');
      }
      router.push('/thanks');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '제출 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f8' }}>
      <header className="header-gradient text-white pt-6 pb-0 px-4 text-center overflow-hidden">
        <p className="text-xs opacity-75 tracking-widest uppercase mb-1">POSCO International</p>
        <h1 className="text-xl font-bold">DX 리터러시 향상 교육</h1>
        <p className="text-sm opacity-85 mt-1 mb-3">제{session}회차 만족도 조사</p>
        <div className="flex justify-center items-end">
          <img src="/포잉.png" alt="" className="w-16 h-16 object-contain opacity-95" style={{ marginBottom: '-4px' }} />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit}>

          {/* Q1 */}
          <div className="survey-card mb-5">
            <h2 className="text-sm font-bold mb-4" style={{ color: '#00704a' }}>
              1. 성명/직급/부서를 적어주세요.
            </h2>
            <div className="space-y-3">
              {[
                { label: '성명', value: name, set: setName },
                { label: '직급', value: grade, set: setGrade },
                { label: '부서', value: department, set: setDepartment },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-10 flex-shrink-0">{label}</span>
                  <input
                    type="text"
                    className="form-input"
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={label + ' 입력'}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <RadioGroup
            questionNum="2."
            label={<>급변 교육 내용이 기존의 업무 방식을 개선하거나 편의성을 높이는 데<br className="hidden sm:block" />도움이 될 것으로 기대하십니까?</>}
            options={Q2_OPTIONS}
            value={q2}
            onChange={setQ2}
          />

          {/* Q3 */}
          <RadioGroup
            questionNum="3."
            label="강사의 강의 방법 및 설명 능력은 학습에 효과적이었습니까?"
            options={Q3_OPTIONS}
            value={q3}
            onChange={setQ3}
          />

          {/* Q4 */}
          <div className="survey-card mb-5">
            <h2 className="text-sm font-bold mb-3" style={{ color: '#00704a' }}>
              4. 본 교육에서 좋았던 점이나, 향후 교육에 반영되길 바라는 점(개선사항)을<br className="hidden sm:block" />자유롭게 기술해 주세요.
            </h2>
            <textarea
              className="form-input"
              rows={4}
              value={q4}
              onChange={e => setQ4(e.target.value)}
              placeholder="자유롭게 작성해주세요."
            />
          </div>

          {/* Q5 */}
          <RadioGroup
            questionNum="5."
            label="본 교육에 대한 전반적인 만족도를 기재해주시기 바랍니다."
            options={Q5_OPTIONS}
            value={q5}
            onChange={setQ5}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 text-center py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              홈으로
            </Link>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={submitting}>
              {submitting ? '제출 중...' : '설문 제출'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
