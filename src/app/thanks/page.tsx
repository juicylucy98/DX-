import Link from 'next/link';

export default function ThanksPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f0f4f8' }}>
      <div className="survey-card text-center max-w-sm w-full">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#00704a' }}>감사합니다!</h1>
        <p className="text-gray-600 mb-1 text-sm leading-relaxed">소중한 의견을 제출해주셨습니다.</p>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">앞으로도 많은 관심 부탁드립니다.</p>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium" style={{ color: '#00704a' }}>POSCO International DX 리터러시 향상 교육</p>
        </div>
        <Link href="/" className="btn-primary block text-center" style={{ textDecoration: 'none', padding: '0.625rem 1rem' }}>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
