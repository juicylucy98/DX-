/**
 * Google Sheets 연동 (Apps Script 웹앱 webhook)
 * 환경변수 GOOGLE_SHEETS_WEBHOOK_URL 이 설정되면 자동으로 활성화됩니다.
 */

const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || '';

export async function sendToSheets(data: Record<string, unknown>): Promise<void> {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch { /* 실패해도 설문 제출에는 영향 없음 */ }
}
