// node check-copy.js : 문구 규칙 검사 (출시-기준.md 4번). 위반이 없으면 OK, 있으면 종료 코드 1.
// 규칙 1) 깨진 글자  2) 격식체 "니다"  3) 한글이 든 문자열이나 HTML 글 속의 코드와 약어
// 한계: 줄 단위 정규식이라 줄 사이로 이어진 문자열은 못 잡는다. 틀 검사기이지 구문 분석기가 아니다.
const fs = require('fs'), path = require('path');
const FILES = ['_head.html', '_engine.js', '_ui.js'];
const BANNED = /[—–▶◀→←↑↓×✔✖①②③④⑤−]/;
const BANNED_G = new RegExp(BANNED.source, 'g');
const HANGUL = /[가-힣]/;
const TOKENS = [[/\b(RP|ARIA|DSMB|EVOLVE)\b/, '약어'], [/\b[ABC][1-7]\b/, '노드 코드'], [/\bX[1-5]\b/, '조합 코드']];
const STR = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
let bad = 0;
const out = (f, n, rule, s) => { bad++; console.log(f + ':' + n + ': ' + rule + ': ' + s.trim().slice(0, 90)); };
for (const f of FILES) {
  const lines = fs.readFileSync(path.join(__dirname, f), 'utf8').split(/\r?\n/);
  let inNodes = false;
  lines.forEach((ln, i) => {
    const n = i + 1;
    if (f === '_engine.js') { if (/^var NODES = \[/.test(ln)) inNodes = true; else if (inNodes && /^\];/.test(ln)) inNodes = false; }
    const m = ln.match(BANNED_G); if (m) out(f, n, '깨진 글자 ' + m.join(''), ln);
    if (ln.indexOf('니다') >= 0) out(f, n, '격식체 니다', ln.slice(Math.max(0, ln.indexOf('니다') - 20)));
    if (inNodes) return;
    const segs = (ln.match(STR) || []).slice();
    if (f === '_head.html') (ln.match(/>[^<>]+</g) || []).forEach(s => segs.push(s));
    const seen = new Set();
    segs.forEach(s => { if (!HANGUL.test(s)) return; TOKENS.forEach(t => { const x = s.match(t[0]); if (x && !seen.has(x[0])) { seen.add(x[0]); out(f, n, t[1] + ' ' + x[0], s); } }); });
  });
}
if (bad) { console.log('\n위반 ' + bad + '건'); process.exit(1); }
console.log('OK');
