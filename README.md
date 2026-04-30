# DX 리터러시 향상 교육 만족도 조사

POSCO International 조직문화혁신그룹에서 운영하는 **DX 리터러시 향상 교육** 만족도 조사 시스템입니다.

## 📌 배포 URL

> **https://dx-peach.vercel.app**

## 📂 프로젝트 구조

```
DX-/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # 회차 선택 홈 화면
│   │   ├── survey/[session]/page.tsx # 설문 작성 페이지
│   │   ├── thanks/page.tsx           # 제출 완료 페이지
│   │   └── admin/
│   │       ├── page.tsx              # 관리자 로그인
│   │       └── dashboard/page.tsx    # 관리자 대시보드
│   │   └── api/
│   │       ├── survey/submit/        # 설문 제출 API
│   │       └── admin/                # 관리자 API (데이터 조회, 설정 변경)
│   ├── components/
│   │   ├── ExportButtons.tsx         # 엑셀 내보내기 버튼
│   │   └── MissingRespondents.tsx    # 미응답자 조회
│   └── lib/
│       ├── blob.ts                   # Vercel Blob 스토리지 연동
│       └── types.ts                  # 공통 타입 정의
├── public/
│   └── 포잉.png                      # 펭귄 마스코트 이미지
├── README.md
└── package.json
```

## 🚀 로컬 실행

```bash
npm install
npm run dev
```

`.env.local` 파일에 아래 환경 변수가 필요합니다:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
ADMIN_PASSWORD_HASH=e923913e6903f339fb75a725ee59ec8a678bb9f964412aafe92962750b4765a1
```

> 관리자 비밀번호 기본값: `981213`  
> 비밀번호 해시는 SHA-256 기준입니다.

## ☁️ Vercel 배포

1. GitHub 레포(`juicylucy98/DX-`)를 Vercel에 연결
2. Vercel Storage → Blob → Create Store → 프로젝트에 연결
3. 환경 변수 `BLOB_READ_WRITE_TOKEN`, `ADMIN_PASSWORD_HASH` 설정
4. 자동 배포 완료

## 🗂️ 주요 기능

### 설문 참여자
- 4회차 ~ 12회차 중 본인 교육 회차 선택
- 성명 / 직급 / 부서 입력
- Q2: 교육 내용 도움 여부 (5점 척도)
- Q3: 강사 강의 효과 (5점 척도)
- Q4: 자유 의견 (선택)
- Q5: 전반적 만족도 (5점 척도)

### 관리자 (`/admin`)
- 설문 개폐 토글 (전체 / 회차별)
- 응답 결과 실시간 조회 (전체 / 회차 필터)
- 평균 점수 통계 (교육 내용 / 강사 / 만족도)
- 직급별 통계 테이블
- Q4 자유 의견 감성 분석 (긍정 / 부정 / 중립)
- **엑셀 저장**: 전체요약 / 회차별통계 / 직급별통계 / 개별응답
- **미응답자 조회**: 수강자 명단 엑셀 업로드 → 미응답자 필터링 → 이메일 일괄 복사

## 📊 엑셀 수강자 명단 형식

미응답자 조회 기능 사용 시, 업로드하는 엑셀 파일은 아래 형식이어야 합니다:

- 헤더 행에 `E-mail` 컬럼 포함
- 헤더 행에 `이름` 또는 `Name` 컬럼 포함
- 헤더 다음 행(영문 헤더 행)에 `Department` 컬럼 포함
- 데이터는 영문 헤더 행 다음 행부터 시작

## 🛠 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 스토리지 | Vercel Blob |
| 엑셀 처리 | SheetJS (xlsx) |
| 배포 | Vercel |

## 📞 문의

조직문화혁신그룹 · POSCO International
