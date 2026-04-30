"""
DX 리터러시 향상 교육 만족도 조사 - 로컬 Flask 서버 (참조용)
=====================================================
Vercel 배포 URL: https://dx-peach.vercel.app

이 파일은 로컬 환경에서 데이터를 확인하거나
간단히 테스트할 때 사용하는 참조용 스크립트입니다.
실제 운영은 Vercel + Blob 스토리지를 사용합니다.

실행:
    pip install flask
    python app.py
"""

import json
import os
from datetime import datetime
from flask import Flask, jsonify, request, render_template_string

app = Flask(__name__)

DATA_FILE = "dx_responses.json"

# ---------------------------------------------------------------------------
# 데이터 유틸
# ---------------------------------------------------------------------------

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"settings": {"open": True}, "responses": []}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# 라우트
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template_string("""
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>DX 리터러시 향상 교육 만족도 조사 (로컬)</title>
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #333; }
    h1   { color: #00704a; border-bottom: 2px solid #00704a; padding-bottom: 8px; }
    a    { color: #00704a; }
    .info { background: #f0f9f4; border: 1px solid #c3e6d4; border-radius: 8px; padding: 16px; margin: 20px 0; }
    table { border-collapse: collapse; width: 100%; margin-top: 16px; font-size: 13px; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #00704a; color: #fff; }
    tr:nth-child(even) { background: #f8f8f8; }
  </style>
</head>
<body>
  <h1>🐧 DX 리터러시 향상 교육 만족도 조사</h1>
  <div class="info">
    <strong>운영 URL:</strong> <a href="https://dx-peach.vercel.app" target="_blank">https://dx-peach.vercel.app</a><br>
    <strong>이 서버:</strong> 로컬 테스트용 (데이터는 dx_responses.json에 저장)
  </div>
  <h2>API 목록</h2>
  <table>
    <tr><th>메서드</th><th>경로</th><th>설명</th></tr>
    <tr><td>GET</td><td>/api/responses</td><td>전체 응답 조회</td></tr>
    <tr><td>POST</td><td>/api/submit</td><td>설문 제출</td></tr>
    <tr><td>GET</td><td>/api/stats</td><td>통계 요약</td></tr>
    <tr><td>GET</td><td>/api/settings</td><td>설문 개폐 상태</td></tr>
    <tr><td>POST</td><td>/api/settings</td><td>설문 개폐 변경</td></tr>
  </table>
</body>
</html>
""")


@app.route("/api/responses", methods=["GET"])
def get_responses():
    data = load_data()
    session = request.args.get("session", type=int)
    responses = data.get("responses", [])
    if session:
        responses = [r for r in responses if r.get("session") == session]
    return jsonify(responses)


@app.route("/api/submit", methods=["POST"])
def submit():
    data = load_data()
    if not data["settings"].get("open", True):
        return jsonify({"error": "설문이 마감되었습니다."}), 403

    body = request.get_json()
    required = ["session", "name", "grade", "department", "q2", "q3", "q5"]
    for field in required:
        if not body.get(field):
            return jsonify({"error": f"{field} 필드가 필요합니다."}), 400

    entry = {
        "timestamp": datetime.now().isoformat(),
        "session":    int(body["session"]),
        "name":       str(body["name"]).strip(),
        "grade":      str(body["grade"]).strip(),
        "department": str(body["department"]).strip(),
        "q2":         int(body["q2"]),
        "q3":         int(body["q3"]),
        "q4":         str(body.get("q4", "")),
        "q5":         int(body["q5"]),
    }
    data["responses"].append(entry)
    save_data(data)
    return jsonify({"success": True})


@app.route("/api/stats", methods=["GET"])
def stats():
    data = load_data()
    responses = data.get("responses", [])
    if not responses:
        return jsonify({"total": 0, "avgQ2": None, "avgQ3": None, "avgQ5": None})

    total = len(responses)
    avg = lambda key: round(sum(r[key] for r in responses) / total, 2)

    # 회차별 통계
    sessions = {}
    for r in responses:
        s = r["session"]
        if s not in sessions:
            sessions[s] = []
        sessions[s].append(r)

    session_stats = []
    for s, rs in sorted(sessions.items()):
        n = len(rs)
        session_stats.append({
            "session": s,
            "total":   n,
            "avgQ2":   round(sum(r["q2"] for r in rs) / n, 2),
            "avgQ3":   round(sum(r["q3"] for r in rs) / n, 2),
            "avgQ5":   round(sum(r["q5"] for r in rs) / n, 2),
        })

    return jsonify({
        "total":        total,
        "avgQ2":        avg("q2"),
        "avgQ3":        avg("q3"),
        "avgQ5":        avg("q5"),
        "sessionStats": session_stats,
    })


@app.route("/api/settings", methods=["GET", "POST"])
def settings():
    data = load_data()
    if request.method == "GET":
        return jsonify(data["settings"])

    body = request.get_json()
    if "open" in body:
        data["settings"]["open"] = bool(body["open"])
    save_data(data)
    return jsonify({"success": True, "settings": data["settings"]})


# ---------------------------------------------------------------------------
# 메인
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 50)
    print("DX 리터러시 향상 교육 만족도 조사 - 로컬 서버")
    print("실제 운영: https://dx-peach.vercel.app")
    print("로컬 주소: http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
