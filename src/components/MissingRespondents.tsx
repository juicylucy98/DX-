'use client';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import type { DXResponse } from '@/lib/types';

interface Attendee { name: string; email: string; }
interface SheetData { sheetName: string; attendees: Attendee[]; }

async function parseWorkbook(file: File): Promise<SheetData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary', codepage: 949 });
        const result: SheetData[] = [];
        for (const sheetName of wb.SheetNames) {
          const rows: string[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' }) as string[][];
          let headerRow = -1, nameCol = -1, emailCol = -1;
          for (let i = 0; i < Math.min(6, rows.length); i++) {
            const row = rows[i].map(v => String(v));
            const eIdx = row.findIndex(v => v === 'E-mail');
            if (eIdx >= 0) {
              headerRow = i; emailCol = eIdx;
              nameCol = row.findIndex(v => v.includes('Name') || v.includes('이름'));
              break;
            }
          }
          if (headerRow < 0 || emailCol < 0 || nameCol < 0) continue;
          const attendees: Attendee[] = [];
          for (let i = headerRow + 2; i < rows.length; i++) {
            const row = rows[i];
            const name = String(row[nameCol] || '').trim();
            const email = String(row[emailCol] || '').trim();
            if (name && email && email.includes('@')) attendees.push({ name, email });
          }
          if (attendees.length > 0) result.push({ sheetName, attendees });
        }
        resolve(result);
      } catch (err) { reject(err); }
    };
    reader.readAsBinaryString(file);
  });
}

export default function MissingRespondents({ responses }: { responses: DXResponse[] }) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [missing, setMissing] = useState<Attendee[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const parsed = await parseWorkbook(file);
      setSheets(parsed);
      setSelectedSheet(parsed[0]?.sheetName || '');
      setMissing(null);
    } catch { alert('파일 파싱 실패'); }
    finally { setLoading(false); }
  };

  const handleCompare = () => {
    const sheet = sheets.find(s => s.sheetName === selectedSheet);
    if (!sheet) return;
    const responded = new Set(responses.map(r => r.name.trim()));
    setMissing(sheet.attendees.filter(a => !responded.has(a.name)));
  };

  const copyEmails = () => {
    navigator.clipboard.writeText(missing!.map(m => m.email).join('; '));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <p className="text-sm font-semibold text-gray-700 mb-3">📋 미응답자 조회</p>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          {loading ? '파싱 중...' : '수강자 명단 업로드 (.xls/.xlsx)'}
          <input type="file" accept=".xls,.xlsx" onChange={handleFile} className="hidden" />
        </label>
        {sheets.length > 0 && <>
          <select value={selectedSheet} onChange={e => setSelectedSheet(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
            {sheets.map(s => <option key={s.sheetName} value={s.sheetName}>{s.sheetName}</option>)}
          </select>
          <button onClick={handleCompare}
            className="text-sm px-4 py-2 rounded-lg font-semibold text-white transition-colors"
            style={{ background: '#00704a' }}>
            비교하기
          </button>
        </>}
      </div>

      {missing !== null && (
        missing.length === 0
          ? <p className="text-sm text-green-600 font-medium">✅ 모든 수강자가 응답 완료했습니다!</p>
          : <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">미응답자 <span className="text-red-500 font-bold">{missing.length}명</span></p>
              <button onClick={copyEmails}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-colors"
                style={{ background: copied ? '#6b7280' : '#00704a' }}>
                {copied ? '복사됨 ✓' : '이메일 전체 복사'}
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-600 font-semibold">이름</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-semibold">이메일</th>
                  </tr>
                </thead>
                <tbody>
                  {missing.map((m, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700 font-medium">{m.name}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs font-mono">{m.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
      )}
    </div>
  );
}
