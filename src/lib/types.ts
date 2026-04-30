export interface DXResponse {
  id: string;
  timestamp: string;
  session: number; // 1~30
  name: string;
  grade: string;   // 직급
  department: string; // 부서
  q2: number; // 교육 도움 기대도 (1~5)
  q3: number; // 강사 효과성 (1~5)
  q4: string; // 좋았던 점/개선사항
  q5: number; // 전반적 만족도 (1~5)
}

export interface Settings {
  open: boolean;
}

export interface SessionAnalytics {
  session: number;
  total: number;
  avgQ2: number;
  avgQ3: number;
  avgQ5: number;
  responses: DXResponse[];
}

export interface AdminData {
  settings: Settings;
  sessions: SessionAnalytics[];
  allResponses: DXResponse[];
}
