// node make-sfx.js : sfx-src 의 효과음 12개의 크기를 맞춰 인코딩하고 _sfx.js 로 묶어요. node 와 ffmpeg 만 써요.
// 자리마다 목표 Mmax(EBU R128 순간 음량의 최댓값, LUFS)에 맞춰 줄이기만 해요. 결과를 다시 재서 어긋나면 _sfx.js 를 쓰지 않고 멈춰요.
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { spawnSync } = require('child_process');
const SR = 44100;
const TABLE = {
  tap:    { src: 'click_002.ogg',        pack: 'Interface Sounds', lufs: -36 },
  start:  { src: 'maximize_009.ogg',     pack: 'Interface Sounds', lufs: -26 },
  done:   { src: 'confirmation_004.ogg', pack: 'Interface Sounds', lufs: -23 },
  bubble: { src: 'drop_002.ogg',         pack: 'Interface Sounds', lufs: -30 },
  alert:  { src: 'question_002.ogg',     pack: 'Interface Sounds', lufs: -23 },
  good:   { src: 'confirmation_001.ogg', pack: 'Interface Sounds', lufs: -24 },
  bad:    { src: 'error_006.ogg',        pack: 'Interface Sounds', lufs: -24 },
  aria:   { src: 'error_003.ogg',        pack: 'Interface Sounds', lufs: -21 },
  pass:   { src: 'jingles_PIZZI16.ogg',  pack: 'Music Jingles',    lufs: -21 },
  fail:   { src: 'jingles_PIZZI00.ogg',  pack: 'Music Jingles',    lufs: -21 },
  win:    { src: 'jingles_PIZZI10.ogg',  pack: 'Music Jingles',    lufs: -19 },
  lose:   { src: 'jingles_PIZZI11.ogg',  pack: 'Music Jingles',    lufs: -19 }
};
let tmp; // 임시 폴더. process.exit 는 finally 를 건너뛰므로 die 가 직접 지운다
const die = m => { console.error('FAIL ' + m); if (tmp) fs.rmSync(tmp, { recursive: true, force: true }); process.exit(1); };
const ff = args => { const r = spawnSync('ffmpeg', args, { maxBuffer: 1 << 28 }); if (r.error) die('ffmpeg: ' + r.error.message); return r; };
const db = v => v > 0 ? 20 * Math.log10(v) : -99;
// 모노 44.1kHz 로 풀어 길이(표본), peak(dBFS), 앞 무음(ms)을 센다. 활성 구간은 절댓값이 peak 의 1% 이상인 구간이다
function pcm(f) {
  const r = ff(['-v', 'error', '-i', f, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-']);
  if (r.status !== 0) die('decode ' + f + ': ' + r.stderr);
  const x = new Float32Array(new Uint8Array(r.stdout).buffer); let pk = 0;
  for (const v of x) if (Math.abs(v) > pk) pk = Math.abs(v);
  let a = 0; while (a < x.length && Math.abs(x[a]) < pk * 0.01) a++;
  return { n: x.length, sec: x.length / SR, peak: db(pk), lead: a / SR * 1000 };
}
function mmax(f) {
  const r = ff(['-hide_banner', '-nostats', '-i', f, '-af', 'aformat=channel_layouts=mono,apad=pad_dur=1,ebur128', '-f', 'null', '-']);
  let m = -999, x; const re = /\bM:\s*(-?\d+(?:\.\d+)?)/g, s = String(r.stderr);
  while ((x = re.exec(s))) m = Math.max(m, parseFloat(x[1]));
  if (r.status !== 0 || m === -999) die('Mmax 를 못 쟀어요: ' + f + ' (ffmpeg 종료 코드 ' + r.status + ')');
  return m;
}
const names = Object.keys(TABLE);
// 5. _ui.js 와 이름이 맞는지 (먼저 본다: 어긋나면 인코딩할 필요가 없다)
const ui = fs.readFileSync(path.join(__dirname, '_ui.js'), 'utf8');
const used = new Set(); let m;
const re1 = /(?<![\w.])sfx\(([^)]*)\)/g;
while ((m = re1.exec(ui))) { const re2 = /(?:^|[?:(])\s*'([a-z]+)'/g; let y; while ((y = re2.exec(m[1]))) used.add(y[1]); }
const keys = [], re3 = /^ (\w+):function\(t\)/gm;
while ((m = re3.exec(ui))) keys.push(m[1]);
for (const u of used) if (!TABLE[u]) die('_ui.js 가 sfx(\'' + u + '\') 를 부르는데 표에 없어요');
if (keys.slice().sort().join() !== names.slice().sort().join()) die('_ui.js 의 SFX 키 [' + keys + '] 와 표의 자리 [' + names + '] 가 달라요');

tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sfx-'));
const rows = [], data = [];
try {
  for (const n of names) {
    const t = TABLE[n], src = path.join(__dirname, 'sfx-src', t.src);
    const o = pcm(src), om = mmax(src), gain = t.lufs - om;
    if (!(gain < 0)) die(n + ': 이득이 ' + gain.toFixed(2) + ' dB 로 양수예요 (원본 Mmax ' + om.toFixed(1) + ', 목표 ' + t.lufs + ')');
    const wav = o.sec < 0.2, out = path.join(tmp, n + (wav ? '.wav' : '.mp3'));
    const args = ['-y', '-v', 'error', '-i', src, '-af', 'aformat=sample_fmts=flt:channel_layouts=mono,volume=' + gain.toFixed(4) + 'dB', '-ar', String(SR)]
      .concat(wav ? ['-c:a', 'pcm_s16le'] : ['-c:a', 'libmp3lame', '-b:a', '96k', '-id3v2_version', '0', '-write_xing', '1'])
      .concat(['-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', out]);
    const r = ff(args); if (r.status !== 0) die(n + ': encode ' + r.stderr);
    const buf = fs.readFileSync(out), e = pcm(out), em = mmax(out), want = o.peak + gain, bad = [];
    if (Math.abs(em - t.lufs) > 0.7) bad.push('Mmax ' + em.toFixed(2) + ' (목표 ' + t.lufs + ' ±0.7)');
    if (e.peak > -1.0) bad.push('peak ' + e.peak.toFixed(2) + ' dBFS (-1.0 이하여야 해요)');
    if (Math.abs(e.peak - want) > (wav ? 0.3 : 1.5)) bad.push('peak ' + e.peak.toFixed(2) + ' (원본 peak + 이득 = ' + want.toFixed(2) + ' ±' + (wav ? 0.3 : 1.5) + ')');
    if (e.n < o.n || e.sec > o.sec + 0.06) bad.push('길이 ' + e.sec.toFixed(3) + 's (원본 ' + o.sec.toFixed(3) + 's 이상, +0.06s 이하)');
    if (wav && e.n !== o.n) bad.push('WAV 길이 ' + e.n + ' 표본 (원본 ' + o.n + ')');
    if (e.lead > o.lead + 5) bad.push('앞 무음 ' + e.lead.toFixed(1) + 'ms (원본 ' + o.lead.toFixed(1) + 'ms + 5ms 이하)');
    if (wav) { if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.length !== 44 + e.n * 2) bad.push('WAV 머리글 또는 크기 ' + buf.length + ' (기대 ' + (44 + e.n * 2) + ')'); }
    else if (!/Info|Xing/.test(buf.toString('latin1', 0, 4096))) bad.push('MP3 에 Xing/Info 머리글이 없어요');
    if (bad.length) die(n + ' (' + t.src + '): ' + bad.join('; '));
    data.push(n + ':\'' + buf.toString('base64') + '\'');
    rows.push(t.src + ' -> ' + (wav ? 'WAV' : 'MP3') + ' ' + buf.length + 'B gain ' + gain.toFixed(2) + 'dB Mmax ' + em.toFixed(2) + ' peak ' + e.peak.toFixed(2) + ' dur ' + e.sec.toFixed(3) + 's [' + n + ']');
  }
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }

const head = '// 만든 파일이에요. 직접 고치지 말고 `node make-sfx.js` 로 다시 만들어요.\n// 출처: Kenney (kenney.nl), Creative Commons Zero (CC0).\n' +
  names.map(n => '// ' + n + ': ' + TABLE[n].pack + ' / ' + TABLE[n].src + ' / ' + (rows[names.indexOf(n)].indexOf('WAV') > 0 ? 'WAV' : 'MP3') + ' / ' + TABLE[n].lufs + ' LUFS\n').join('');
const js = head + 'var SFXDATA={\n' + data.join(',\n') + '};\n';
fs.writeFileSync(path.join(__dirname, '_sfx.js'), js);
console.log(rows.join('\n'));
console.log('OK 12 (_sfx.js ' + Buffer.byteLength(js) + ' bytes)');
