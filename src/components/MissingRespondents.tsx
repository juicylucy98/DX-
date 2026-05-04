'use client';
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { DXResponse } from '@/lib/types';

interface Attendee { name: string; email: string; dept: string; }
interface SheetData { sheetName: string; attendees: Attendee[]; }

function normDept(s: string) {
  return s.replace(/\s+/g, '').toLowerCase();
}

async function parseWorkbook(file: File): Promise<SheetData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary', codepage: 949 });
        const result: SheetData[] = [];

        for (const sheetName of wb.SheetNames) {
          const rows: string[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' }) as string[][];

          let headerRow = -1, nameCol = -1, emailCol = -1, deptCol = -1;
          for (let i = 0; i < Math.min(6, rows.length); i++) {
            const row = rows[i].map(v => String(v));
            const eIdx = row.findIndex(v => v === 'E-mail');
            if (eIdx >= 0) {
              headerRow = i;
              emailCol = eIdx;
              nameCol = row.findIndex(v => v.includes('Name') || v.includes('이름'));
              if (rows.length > i + 1) {
                const engRow = rows[i + 1].map(v => String(v));
                deptCol = engRow.findIndex(v => v === 'Department');
              }
              break;
            }
          }
          if (headerRow < 0 || emailCol < 0 || nameCol < 0) continue;

          const attendees: Attendee[] = [];
          for (let i = headerRow + 2; i < rows.length; i++) {
            const row = rows[i];
            const name = String(row[nameCol] || '').trim();
            const email = String(row[emailCol] || '').trim();
            const dept = deptCol >= 0 ? String(row[deptCol] || '').trim() : '';
            if (name && email && email.includes('@')) {
              attendees.push({ name, email, dept });
            }
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
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xls|xlsx)$/i)) {
      alert('.xls 또는 .xlsx 파일만 업로드 가능합니다.');
      return;
    }
    setLoading(true);
    setMissing(null);
    try {
      const parsed = await parseWorkbook(file);
      setSheets(parsed);
      setSelectedSheet(parsed[0]?.sheetName || '');
    } catch { alert('파일 파싱 실패'); }
    finally { setLoading(false); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleCompare = () => {
    const sheet = sheets.find(s => s.sheetName === selectedSheet);
    if (!sheet) return;

    const respondedByName = new Map<string, string[]>();
    for (const r of responses) {
      const n = r.name.trim();
      if (!respondedByName.has(n)) respondedByName.set(n, []);
      respondedByName.get(n)!.push(normDept(r.department));
    }

    const result: Attendee[] = [];
    for (const a of sheet.attendees) {
      const n = a.name.trim();
      const depts = respondedByName.get(n);
      if (!depts) {
        result.push(a);
      } else {
        const aNorm = normDept(a.dept);
        if (aNorm && !depts.some(d => d && (d.includes(aNorm) || aNorm.includes(d)))) {
          result.push(a);
        }
      }
    }
    setMissing(result);
  };

  const copyEmails = () => {
    navigator.clipboard.writeText(missing!.map(m => m.email).join('; '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <p className="text-sm font-semibold text-gray-700 mb-3">📋 미응답자 조회</p>

      {/* 드래그 앤 드롭 업로드 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed transition-colors mb-4 px-6 py-8 text-center"
        style={{
          borderColor: dragging ? '#2563eb' : '#e5e7eb',
          background: dragging ? '#eff6ff' : '#f9fafb',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFile}
          className="hidden"
        />
        {loading ? (
          <p className="text-sm text-blue-500 font-medium">파싱 중...</p>
        ) : dragging ? (
          <p className="text-sm font-semibold" style={{ color: '#2563eb' }}>여기에 놓으세요!</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-500">파일을 여기로 드래그하거나 클릭해서 선택</p>
            <p className="text-xs text-gray-400 mt-1">.xls / .xlsx</p>
          </>
        )}
      </div>

      {sheets.length > 0 && !loading && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {sheets.length > 1 && (
            <select value={selectedSheet} onChange={e => { setSelectedSheet(e.target.value); setMissing(null); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
              {sheets.map(s => <option key={s.sheetName} value={s.sheetName}>{s.sheetName}</option>)}
            </select>
          )}
          <span className="text-xs text-gray-400">
            {sheets.find(s => s.sheetName === selectedSheet)?.attendees.length}명 로드됨
          </span>
          <button onClick={handleCompare}
            className="text-sm px-4 py-2 rounded-lg font-semibold text-white"
            style={{ background: '#2563eb' }}>
            비교하기
          </button>
        </div>
      )}

      {missing !== null && (
        missing.length === 0
          ? <p className="text-sm text-blue-600 font-medium">✅ 모든 수강자가 응답 완료했습니다!</p>
          : <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">미응답자 <span className="text-red-500 font-bold">{missing.length}명</span></p>
              <button onClick={copyEmails}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
                style={{ background: copied ? '#6b7280' : '#2563eb' }}>
                {copied ? '복사됨 ✓' : '이메일 전체 복사'}
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-600 font-semibold">이름</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-semibold">부서</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-semibold">이메일</th>
                  </tr>
                </thead>
                <tbody>
                  {missing.map((m, i) => (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-700 font-medium">{m.name}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{m.dept}</td>
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
