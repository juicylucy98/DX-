/**
 * Vercel Blob 데이터 복구 스크립트
 * 실행: node recover_data.mjs
 *
 * .env.local 파일에 BLOB_READ_WRITE_TOKEN이 있어야 합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env.local 파일에서 토큰 읽기
function loadToken() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local 파일을 찾을 수 없습니다.');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    if (line.startsWith('BLOB_READ_WRITE_TOKEN=')) {
      return line.slice('BLOB_READ_WRITE_TOKEN='.length).trim().replace(/^["']|["']$/g, '');
    }
  }
  console.error('❌ BLOB_READ_WRITE_TOKEN을 찾을 수 없습니다.');
  process.exit(1);
}

async function main() {
  const token = loadToken();
  console.log('🔑 토큰 로드 완료');
  console.log('📡 Vercel Blob에서 파일 목록 조회 중...\n');

  // Blob 목록 조회
  let blobs = [];
  let cursor = undefined;

  try {
    do {
      const url = new URL('https://blob.vercel-storage.com');
      url.searchParams.set('prefix', 'dx-response-');
      url.searchParams.set('limit', '1000');
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('❌ 목록 조회 실패:', res.status, text);
        break;
      }

      const data = await res.json();
      blobs = blobs.concat(data.blobs || []);
      cursor = data.cursor;
      console.log(`  → ${blobs.length}개 파일 발견`);
    } while (cursor);
  } catch (err) {
    console.error('❌ 네트워크 오류:', err.message);
  }

  if (blobs.length === 0) {
    console.log('\n⚠️  복구할 데이터가 없거나 Blob 접근이 완전히 차단되었습니다.');
    console.log('   → Vercel 대시보드에서 플랜 업그레이드 후 다시 시도하세요.');
    return;
  }

  console.log(`\n✅ 총 ${blobs.length}개 응답 발견. 다운로드 중...\n`);

  const responses = [];
  let success = 0, fail = 0;

  for (const blob of blobs) {
    try {
      const res = await fetch(blob.url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        responses.push(data);
        success++;
        process.stdout.write(`\r  다운로드: ${success}/${blobs.length}`);
      } else {
        const errText = await res.text();
        if (fail === 0) console.error(`\n첫 번째 실패: ${res.status} ${errText.slice(0,200)}`);
        fail++;
      }
    } catch {
      fail++;
    }
  }

  console.log(`\n\n📊 다운로드 완료: 성공 ${success}개, 실패 ${fail}개\n`);

  if (responses.length === 0) {
    console.log('⚠️  복구된 데이터가 없습니다.');
    return;
  }

  // JSON 저장
  const jsonPath = path.join(__dirname, 'recovered_data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(responses, null, 2), 'utf-8');
  console.log(`✅ JSON 저장: recovered_data.json (${responses.length}건)`);

  // CSV 저장
  const csvPath = path.join(__dirname, 'recovered_data.csv');
  const headers = ['제출시간', '회차', '이름', '직급', '부서', 'Q2(교육내용)', 'Q3(강사)', 'Q4(의견)', 'Q5(만족도)'];
  const rows = responses
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(r => [
      new Date(r.timestamp).toLocaleString('ko-KR'),
      r.session + '회차',
      r.name || '',
      r.grade || '',
      r.department || '',
      r.q2 || '',
      r.q3 || '',
      (r.q4 || '').replace(/,/g, ' ').replace(/\n/g, ' '),
      r.q5 || '',
    ]);

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  fs.writeFileSync(csvPath, '﻿' + csv, 'utf-8'); // BOM for Excel
  console.log(`✅ CSV 저장: recovered_data.csv (엑셀에서 바로 열기 가능)`);

  // 요약 출력
  console.log('\n📈 데이터 요약:');
  console.log(`  총 응답수: ${responses.length}건`);
  const sessions = [...new Set(responses.map(r => r.session))].sort((a, b) => a - b);
  console.log(`  진행 회차: ${sessions.join(', ')}회차`);
  const avg = key => (responses.reduce((s, r) => s + (r[key] || 0), 0) / responses.length).toFixed(2);
  console.log(`  교육내용 평균: ${avg('q2')}점`);
  console.log(`  강사 평균: ${avg('q3')}점`);
  console.log(`  만족도 평균: ${avg('q5')}점`);
}

main();
