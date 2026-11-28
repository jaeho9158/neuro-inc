// ===================== UI (전염병 주식회사 스타일 · 비전공자용 쉬운말) =====================
if (typeof document !== 'undefined') (function(){
var $=function(s){return document.querySelector(s);},$$=function(s){return document.querySelectorAll(s);};
var st=null,diff='normal',tab='A',selId=null,prev={},acc=0,last=0,resumeAfter=false,muted=false,AC=null,bubKey='',evOpen=false,seenOwned=0,seenAria=0,prevPipe=[],menuWas=false,bannerT=0,spaceDown=false,smallShown=false;
var PORT=matchMedia('(orientation:portrait) and (max-width:900px)'),RM=matchMedia('(prefers-reduced-motion: reduce)');
function calm(){return RM.matches;}
// 조사: 마지막 글자의 받침으로 고른다. 숫자는 읽는 소리(영 일 이 삼 사 오 육 칠 팔 구)의 받침으로 본다. 0 없음, 1 받침, 2 ㄹ받침
function jong(w){w=String(w);var ch=w.charAt(w.length-1),i='0123456789'.indexOf(ch),c;if(i>=0)return '013678'.indexOf(ch)<0?0:('178'.indexOf(ch)>=0?2:1);c=ch.charCodeAt(0)-44032;if(c<0||c>11171)return 0;c%=28;return c===0?0:(c===8?2:1);}
function eul(w){return w+(jong(w)?'을':'를');}
function qeul(w){return '「'+w+'」'+(jong(w)?'을':'를');}
function ro(w){return w+(jong(w)===1?'으로':'로');}
function fm(f){return String(f).replace(/\d+/g,'<sub>$&</sub>');} // 분자식의 숫자는 아래 첨자로 (HTML에만 씀)
try{muted=localStorage.getItem('neuroinc.mute')==='1';}catch(e){}
var ATOM={C:'탄소',H:'수소',O:'산소',N:'질소'},ATOMTIP='실험실에서 화합물을 만드는 원료예요. 자동으로 쌓이지 않아요. 실험실에서 연구점수로 주문해야 하고, 주문할수록 비싸져요.',CONDK={cool:'냉각',heat:'가열',catalyst:'촉매'};
// ---------- 소리 (Kenney 표본을 재생하고, 표본을 풀지 못하면 직접 합성한 소리로 대신해요. 한 소리 1초 이하, 크기는 make-sfx.js 의 목표값) ----------
var SFXLOG=[],lastSfx=0,SFXVIA=[],SBUF={},SFXGAIN=.7071,VC=null,redec=true; // SFXGAIN: 표본 전체의 크기 손잡이. 표본은 한 채널로 재서 맞췄는데 재생은 양쪽 스피커로 같은 소리가 나가 3 LU 커지므로 .7071(-3 dB)로 되돌려요. VC: 합성 소리를 낼 컨텍스트(play 가 정해요)
function vo(t,f,d,ty,pk,f2,lp){var o=VC.createOscillator(),g=VC.createGain(),x=o;o.type=ty||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(pk||.06,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  if(lp){var l=VC.createBiquadFilter();l.type='lowpass';l.frequency.value=lp;o.connect(l);l.connect(g);}else o.connect(g);g.connect(VC.destination);o.start(t);o.stop(t+d+.02);}
var SFX={
 tap:function(t){vo(t,620,.05,'triangle',.05);},
 start:function(t){vo(t,523,.18,'triangle',.06);vo(t+.09,784,.25,'triangle',.06);},
 done:function(t){vo(t,659,.16,'sine',.06);vo(t+.08,784,.16,'sine',.06);vo(t+.16,1047,.3,'sine',.06);},
 bubble:function(t){vo(t,1568,.07,'sine',.04);vo(t+.07,2093,.09,'sine',.04);},
 alert:function(t){vo(t,220,.14,'square',.05,0,600);vo(t+.2,220,.14,'square',.05,0,600);},
 good:function(t){vo(t,523,.12,'sine',.06);vo(t+.1,659,.22,'sine',.06);},
 bad:function(t){vo(t,392,.14,'triangle',.06);vo(t+.12,370,.26,'triangle',.06);},
 aria:function(t){vo(t,300,.3,'sawtooth',.05,110,500);},
 pass:function(t){[523,659,784].forEach(function(f,i){vo(t+i*.07,f,.14,'triangle',.05);});vo(t+.21,1047,.3,'triangle',.05);},
 fail:function(t){vo(t,440,.18,'triangle',.06);vo(t+.16,330,.3,'triangle',.06);},
 win:function(t){[523,659,784,1047].forEach(function(f,i){vo(t+i*.1,f,.15,'sine',.06);});vo(t+.4,1319,.38,'sine',.06);},
 lose:function(t){vo(t,392,.2,'triangle',.06,0,900);vo(t+.2,330,.2,'triangle',.06,0,900);vo(t+.4,262,.35,'triangle',.06,0,900);}};
function play(c,n,t){var b=SBUF[n];if(b){var s=c.createBufferSource(),g=c.createGain();s.buffer=b;g.gain.value=SFXGAIN;s.connect(g);g.connect(c.destination);s.start(t);return 'sample';}if(SFX[n]){VC=c;SFX[n](t);return 'synth';}return 'off';}
function sfx(n){lastSfx=performance.now();SFXLOG.push(n);if(SFXLOG.length>20)SFXLOG.shift();var p='off';if(!muted&&AC)try{rs();p=play(AC,n,AC.currentTime+.01);}catch(e){p='off';}SFXVIA.push(n+':'+p);if(SFXVIA.length>20)SFXVIA.shift();}
// 표본 풀기: 어떤 실패도 밖으로 새지 않아요 (예외도, 잡히지 않은 거부도 없어요)
function decodeAll(C){if(typeof SFXDATA==='undefined'||!SFXDATA)return;Object.keys(SFXDATA).forEach(function(n){if(SBUF[n])return;try{var a=atob(SFXDATA[n]),u=new Uint8Array(a.length),i,no=function(){},p;for(i=0;i<a.length;i++)u[i]=a.charCodeAt(i);p=C.decodeAudioData(u.buffer,function(b){if(b)SBUF[n]=b;},no);if(p&&p.catch)p.catch(no);}catch(e){}});}
try{var OC=window.OfflineAudioContext||window.webkitOfflineAudioContext;decodeAll(new OC(1,44100,44100));}catch(e){} // 사용자 조작 전에 AudioContext 를 만들면 경고가 떠서, 오프라인 컨텍스트로 풀어요. 못 푼 자리는 첫 조작에서 wake 가 AC 로 한 번 더 풀어요
function rs(){if(AC.state==='suspended'){var p=AC.resume();if(p&&p.catch)p.catch(function(){});}}
function wake(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();rs();if(redec){redec=false;decodeAll(AC);}}catch(e){}}
['pointerdown','touchend','keydown'].forEach(function(n){addEventListener(n,wake,{capture:true,passive:true});});
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('button,[role=button],summary,.bub')&&performance.now()-lastSfx>40)sfx('tap');
  var bt=e.target&&e.target.closest&&e.target.closest('button,.st,summary'); // 마우스나 터치로 누른 버튼, 약 성능 줄, 요약 줄은 포커스를 풀어, 스페이스가 멈춤과 계속으로 동작하게 해요
  if(e.detail>0&&bt&&document.activeElement===bt)bt.blur();});
// ---------- 게임 안 대화 상자 (alert/confirm 대신) ----------
var dlgB=[];
function dropTa(){var t=$('#dlgTa');if(t)t.parentNode.removeChild(t);}
function dlg(title,body,btns){dropTa();$('#dlgT').textContent=title;$('#dlgB').textContent=body;var box=$('#dlgBtns');box.innerHTML='';dlgB=btns;
  btns.forEach(function(b,i){var e=document.createElement('button');e.className='btn'+(b[2]?' gh':'');e.textContent=b[0];e.onclick=function(){dlgClose(i);};box.appendChild(e);});
  $('#dlg').classList.add('show');box.firstChild.focus();}
function dlgClose(i){$('#dlg').classList.remove('show');dropTa();var b=dlgB[i];dlgB=[];if(b&&b[1])b[1]();}
function halted(){return PORT.matches||smallOpen()||$('#dlg').classList.contains('show')||$('#quizOv').classList.contains('show');}
function smallOpen(){return $('#small').classList.contains('show');}
function blocked(){return !st||$$('.ov.show').length>0;} // 게임이 없거나 창이 열려 있으면 HUD 버튼은 아무 일도 안 해요
// [쉬운 이름, 무슨 일을 하나, 좋은 점, 대가]
var EASY={
A1:['기름과 친해지기','뇌 혈관벽은 기름막이에요. 약을 기름과 친하게 바꾸면 장벽을 더 쉽게 통과해요.','뇌 장벽 통과율 조금 올라요','물에 덜 녹아요'],
A2:['수소 손잡이 줄이기','약 표면의 물과 붙는 "손잡이"를 줄이면 막을 슥 지나가요.','뇌 장벽 통과율 조금 올라요','표적에 붙는 힘이 약간 내려가요'],
A3:['표면 전기끌림 줄이기','약 표면의 전기적 끌림(극성)이 작을수록 기름막을 잘 넘어요.','뇌 장벽 통과율 올라요','혈액 단백질에 붙어 쓸 수 있는 약이 줄어요'],
A4:['약 크기 줄이기','작을수록 좁은 틈을 통과해요.','뇌 장벽 통과율 조금 올라요','표적에 붙는 힘이 내려가요'],
A5:['퍼내는 펌프 피하기','뇌 혈관벽의 "약 퍼내는 펌프"에 안 걸리면 들어간 약이 오래 머물러요.','뇌 안에 머무는 약 +35%','없음'],
A6:['택배 셔틀 붙이기','뇌 혈관벽의 철분 수송 문을 열쇠처럼 써서 약을 통째로 들여보내요. 가장 강력한 방법!','뇌 장벽 통과율 크게 올라요, 부작용 줄어요','연구점수가 많이 들어요 · 주입 반응·빈혈 위험'],
A7:['피하주사로 바꾸기','병원 정맥주사 대신 간단한 피하주사로 바꿔요.','연구점수 획득 +25%','없음'],
B1:['떠다니는 응집체 노리기','아밀로이드가 굳기 전 떠다니는 덩어리를 먼저 잡아요. 타우가 덜 번지고 부작용이 비교적 적어요.','타우 번짐 -20%','찌꺼기 제거는 약간 느려져요'],
B2:['굳은 찌꺼기 직접 제거','이미 쌓여 굳은 아밀로이드 찌꺼기를 강하게 지워요.','아밀로이드 제거 +35%','뇌 부종·출혈 위험이 올라요'],
B3:['접착력 두 배','약이 표적에 두 배 세게 붙어요. 같은 양으로 효과가 올라요.','표적 결합 올라요','없음'],
B4:['변형된 찌꺼기 노리기','변형돼 더 독한 찌꺼기를 골라 지워요.','아밀로이드 제거 +25%','없음'],
B5:['청소 세포 호출','뇌 청소 세포를 불러 빨리 치워요. (‘면역 반응 낮추기’와 둘 중 하나만)','아밀로이드 제거 +30%','혈관 염증으로 부작용이 늘어요'],
B6:['면역 반응 낮추기','청소 세포를 덜 자극해 안전해져요. (‘청소 세포 호출’과 둘 중 하나만)','부작용 위험 -30%','제거 속도 -15%'],
B7:['타우 막는 약 추가','아밀로이드를 지워도 타우는 계속 번져요. 타우를 따로 막는 약을 함께 써요.','타우 번짐 -45%','연구점수가 매우 많이 들어요'],
C1:['정기 MRI 촬영','뇌 부종은 겉으로 안 보여요. MRI로 일찍 찾으면 신뢰도 피해가 줄어요.','부작용 조기 발견, 피해 -60%','연구점수 소모'],
C2:['APOE4 유전자 검사','APOE4 유전자가 있으면 부작용 위험이 훨씬 높아요. 미리 가려내 위험을 줄여요.','고위험 환자 위험 제거','연구점수 소모'],
C3:['혈액으로 조기 진단','혈액 검사(p-tau217)로 환자를 일찍 찾아 덜 진행된 상태로 시작해요.','병 진행 단계 -1, 연구점수 +10%','없음'],
C4:['천천히 늘려 투여','용량을 서서히 올려 혈관이 적응하게 해요.','부작용 위험 -35%','첫 6개월은 효과 -20%'],
C5:['이상 시 자동 감량','부작용이 나오면 자동으로 약을 줄이고 피해도 반으로 줄여요.','부작용 피해 -50%','없음'],
C6:['규제 패스트트랙','허가 심사를 앞당겨요. 경쟁사 진척도 늦춰요.','연구점수 +20%, 경쟁사 -8','없음'],
C7:['환자 모집 확대','환자를 많이 모아요. 연구는 빨라지지만 드문 부작용도 더 드러나요.','연구점수 +30%','부작용 위험 +15%']};
var REC={
early:[['C1','부작용은 눈에 안 보여요. MRI부터 갖추세요.'],['B2','초기 환자는 반응이 좋아요. 굳은 찌꺼기를 강하게 지우세요.'],['B3','약이 더 세게 붙으면 같은 양으로 효과가 올라요.'],['C4','천천히 올려 부작용을 줄이세요.'],['A1','이제 약이 뇌에 들어가게 만들 차례예요.'],['A3','뇌 장벽 통과율을 더 올려요.'],['C3','혈액 진단으로 더 일찍 시작해요.'],['A6','셔틀로 뇌 장벽을 통째로 돌파!'],['C5','부작용이 나와도 자동으로 줄여요.']],
apoe4:[['C1','이 환자들은 부작용에 약해요. MRI부터!'],['C2','APOE4 환자가 많아요, 유전자 검사로 위험을 먼저 줄이세요.'],['C4','천천히 늘려 투여하면 혈관이 적응해요.'],['A1','뇌 장벽 통과를 개선해요.'],['A3','뇌 장벽 통과율을 더 올려요.'],['C3','혈액 진단으로 환자를 일찍 찾아요.'],['A6','셔틀은 부작용도 줄여 줘요.'],['B1','굳은 찌꺼기보다 안전한 응집체 표적이 이 환자들에겐 맞아요.'],['B3','접착력으로 낮은 용량의 효과를 보완해요.'],['C5','부작용이 나오면 자동 감량.']],
advanced:[['C1','MRI부터 갖추세요.'],['A1','일단 약이 뇌에 들어가게 해요.'],['A3','뇌 장벽 통과율을 올려요.'],['C3','혈액 진단으로 진행 단계를 낮춰요.'],['A6','셔틀로 뇌 장벽 돌파.'],['B1','타우가 이미 퍼진 환자는 타우를 덜 번지게 하는 약이 중요해요.'],['B3','접착력 강화.'],['C4','부작용 줄이기.'],['B7','이미 퍼진 타우는 항타우 약이 필요해요, 가장 중요!']]};
var P_={
A1:'<path d="M12 3C12 3 5 11 5 15a7 7 0 0014 0C19 11 12 3 12 3z"/>',
A2:'<circle cx="12" cy="12" r="3"/><path d="M3 12h4M17 12h4M12 3v3"/>',
A3:'<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
A4:'<path d="M4 4l6 6M10 6v4H6M20 20l-6-6M14 18v-4h4"/>',
A5:'<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M8 12h8"/>',
A6:'<path d="M12 2c4 3 5 8 3 13H9c-2-5-1-10 3-13z"/><path d="M9 15l-3 4M15 15l3 4"/><circle cx="12" cy="9" r="1.2"/>',
A7:'<path d="M18 3l3 3M16 5l3 3M15 6L6 15l-2 5 5-2 9-9"/><path d="M9 12l3 3"/>',
B1:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="8" r="2"/><circle cx="14" cy="16" r="4"/>',
B2:'<path d="M12 3l7 4v10l-7 4-7-4V7z"/><path d="M12 8v8"/>',
B3:'<path d="M5 4v8a7 7 0 0014 0V4h-4v8a3 3 0 01-6 0V4z"/>',
B4:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
B5:'<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>',
B6:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l4 6M21 9l-4 6"/>',
B7:'<path d="M3 18c4-10 6 4 8-6s4 6 8-6"/><path d="M3 6c4 4 6-2 9 2"/>',
C1:'<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="12" cy="12" r="4"/>',
C2:'<path d="M7 3c0 6 10 6 10 12M17 3c0 6-10 6-10 12M8 6h8M8 18h8"/>',
C3:'<path d="M12 4C12 4 6 11 6 15a6 6 0 0012 0C18 11 12 4 12 4z"/><path d="M12 12v5M9.5 14.5h5"/>',
C4:'<path d="M3 20h5v-5h5v-5h5V5h3"/>',
C5:'<path d="M8 5v14M16 5v14"/>',
C6:'<path d="M4 5l8 7-8 7zM12 5l8 7-8 7z"/>',
C7:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-4 3-6 6-6s6 2 6 6M14 20c0-3 2-5 5-5s3 2 3 5"/>'};
var IC={x:'<path d="M6 6l12 12M18 6L6 18"/>',pause:'<path d="M8 5v14M16 5v14"/>',play:'<path d="M8 5v14l11-7z" fill="currentColor"/>'};
function gl(k,s){return '<svg viewBox="0 0 24 24" width="'+s+'" height="'+s+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[k]+'</svg>';}
function ico(id,s){return '<svg viewBox="0 0 24 24" width="'+(s||30)+'" height="'+(s||30)+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+P_[id]+'</svg>';}
var CAT={A:['침투','뇌 장벽 돌파','A6'],B:['표적','병의 원인 공략','B4'],C:['임상','안전·운영','C1']};
var COCO={antibody_house:['A','Antibody House','결합력이 강한 항체 약물. ‘표적’ 계열 연구가 20% 싸요. 무난한 시작.'],shuttle_lab:['S','Shuttle Lab','뇌 장벽 통과 기술이 좋아요. 핵심 연구 「택배 셔틀 붙이기」가 싸고 바로 개발할 수 있어요.'],small_lab:['M','Small-Molecule Lab','처음부터 작은 분자 약. 뇌엔 잘 들어가지만 병을 늦추는 힘이 약해요.']};

// 화면에는 A1·X3 같은 코드 대신 항상 이름만 보여준다
function clean(t){return String(t).replace(/\b([ABC][1-7])\b/g,function(m,id){return EASY[id]?'「'+EASY[id][0]+'」':m;}).replace(/\bX[1-5]\b/g,function(m){var c=COMBOS.filter(function(x){return x.id===m;})[0];return c?'「'+c.name+'」':m;});}
// 거절 사유는 하단 뉴스에도 남기고, 화면 위쪽에도 잠깐 띄워요 (창이 열려 있어도 보여요)
var noteT=0;
function note(t){var n=$('#note');n.textContent=clean(t);n.style.display='block';clearTimeout(noteT);noteT=setTimeout(function(){n.style.display='none';},2500);}
function refuse(t){say(st,t);note(t);}
function ownedOrRun(id){return st.owned.indexOf(id)>=0||st.pipeline.some(function(p){return p&&p.nodeId===id;});}
function costStr(c){return '연구점수 '+c.rp;}
function nextRec(){var l=REC[st.profile];for(var i=0;i<l.length;i++)if(!ownedOrRun(l[i][0])&&canBuy(st,l[i][0]).ok)return l[i];return null;}
function reqText(n){var t=[];n.req.forEach(function(r){t.push(r+' '+EASY[r][0]);});if(n.reqAny.length)t.push('다음 중 하나: '+n.reqAny.map(function(r){return r+' '+EASY[r][0];}).join(' / '));return t.join(', ');}

// ---------- 시작 ----------
var DL={easy:['쉬움','부작용·타우가 느리고 경쟁사가 늦어요'],normal:['보통','기본 난이도'],hard:['어려움','부작용·타우가 빠르고 경쟁사가 일찍 승인받아요']};
Object.keys(DIFF).forEach(function(k){var b=document.createElement('button');b.className='pill'+(k===diff?' on':'');b.textContent=DL[k][0];b.title=DL[k][1];b.dataset.d=k;b.onclick=function(){diff=k;$$('#diffs .pill').forEach(function(x){x.classList.toggle('on',x.dataset.d===k);});dsc();};$('#diffs').appendChild(b);});
var scn='std';Object.keys(SCN).forEach(function(k){var b=document.createElement('button');b.className='pill'+(k===scn?' on':'');b.textContent=SCN[k].ko;b.title=SCN[k].d;b.dataset.s=k;b.onclick=function(){scn=k;$$('#scns .pill').forEach(function(x){x.classList.toggle('on',x.dataset.s===k);});dsc();};$('#scns').appendChild(b);});
function dsc(){$('#diffD').textContent=DL[diff][1];$('#scnD').textContent=SCN[scn].d;}dsc();
var selCo=Object.keys(COMPANIES)[0],TAG=['추천 · 첫 플레이','','고난도'];Object.keys(COMPANIES).forEach(function(k,i){var c=COCO[k],b=document.createElement('button');b.className='co'+(i===0?' on':'');b.dataset.k=k;b.innerHTML='<span class="ic">'+c[0]+'</span><span><b>'+c[1]+'</b><small>'+c[2]+'</small>'+(TAG[i]?'<em class="tg'+(i===2?' hd':'')+'">'+TAG[i]+'</em>':'')+'</span>';b.onclick=function(){selCo=k;$$('#cos .co').forEach(function(x){x.classList.toggle('on',x.dataset.k===k);});};$('#cos').appendChild(b);});
function syncStart(){$$('#diffs .pill').forEach(function(x){x.classList.toggle('on',x.dataset.d===diff);});$$('#scns .pill').forEach(function(x){x.classList.toggle('on',x.dataset.s===scn);});$$('#cos .co').forEach(function(x){x.classList.toggle('on',x.dataset.k===selCo);});dsc();}
$('#goBtn').onclick=function(){start(selCo);};
var AK='neuroinc.adv',selAdv=null;function advGet(){try{return JSON.parse(localStorage.getItem(AK)||'[]');}catch(e){return [];}}
function advBox(){var a=advGet();selAdv=null;if(!a.length)return '<div class="rule dim">자문위원: 아직 없어요. 승리할 때마다 한 명이 합류해요.</div>';return '<div class="rule"><b>자문위원 선임</b> <span class="dim">한 명만 고를 수 있어요</span><div id="advs" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">'+a.map(function(id){return ADVISORS[id]?'<button class="pill" data-a="'+id+'" title="'+ADVISORS[id].d+'">'+ADVISORS[id].ko+' · '+ADVISORS[id].d+'</button>':'';}).join('')+'</div></div>';}
function advUnlock(){var a=advGet(),left=Object.keys(ADVISORS).filter(function(k){return a.indexOf(k)<0;});if(!left.length)return null;var k=left[Math.floor(Math.random()*left.length)];a.push(k);try{localStorage.setItem(AK,JSON.stringify(a));}catch(e){}return k;}
function start(c,profile){
  st=newState(c,Date.now()&0xffff,diff,profile,scn);st.paused=true;$('#start').classList.remove('show');build(); // 브리핑 뒤 HUD에 빈 값이 비치지 않게 먼저 그려요
  var P=PROFILES[st.profile],r=REC[st.profile][0];
  $('#briefBox').innerHTML='<div class="logo" style="font-size:26px">이번 임상 환자들</div><h2 style="margin-top:12px" class="warn">'+P.ko+'</h2><p>'+P.brief+(profile?'':' <span class="dim">환자군은 판마다 바뀌어요.</span>')+'</p>'+
   '<div class="rule">처음 할 일: <b>「'+EASY[r[0]][0]+'」</b> 개발. '+r[1]+'</div>'+
   advBox()+'<div class="rule"><b>목표</b> 3년 안에 인지 기능(기억하고 판단하는 힘) 50% 이상, 아밀로이드 20 미만.<br><b>패배</b> 타우가 맨 위 감각운동피질에 닿거나, 신뢰도 0, 인지 기능 25% 미만.<br><span class="dim">스페이스바로 시작하고 멈춰요(태블릿은 오른쪽 아래 재생 버튼). 멈춘 동안 천천히 생각해도 돼요.</span></div><div style="text-align:right"><button class="btn" id="briefGo">시작하기</button></div>';
  $('#brief').classList.add('show');$$('#advs .pill').forEach(function(b){b.onclick=function(){selAdv=selAdv===b.dataset.a?null:b.dataset.a;$$('#advs .pill').forEach(function(x){x.classList.toggle('on',x.dataset.a===selAdv);});};});$('#briefGo').onclick=function(){if(selAdv&&applyAdvisor(st,selAdv))say(st,ADVISORS[selAdv].ko+' 선임: '+ADVISORS[selAdv].d);$('#brief').classList.remove('show');paint();var seen=false;try{seen=localStorage.getItem('neuroinc.tut')==='1';}catch(e){}if(!seen)coach(0);};
}
// ---------- 튜토리얼 ----------
var STEPS=[
 {t:'#brain',h:'뇌 지도, 시간과의 싸움',b:'<b class="bad">빨간 원</b>은 나쁜 단백질 <b>타우</b>예요(숫자는 농도). 점선을 따라 시간이 지나면 다음 영역으로 번지고, <b>감각운동피질</b>이 빨개지면 져요. 주황 점은 아밀로이드 찌꺼기고, 약으로 지울 수 있어요.'},
 {t:'#goal,#bEvo',h:'지금 할 일과 개발 버튼',b:'위쪽 초록 상자 <b class="good">지금 할 일</b>이 다음에 할 일을 알려 줘요. 왼쪽 아래 <b class="good">개발</b> 버튼을 누르면 약을 강화하는 트리가 열려요. 비용은 왼쪽 위 <b>연구점수</b>이고, 시간이 지나면 쌓여요.'},
 {t:'#hudR',h:'약 성능과 투여량',b:'오른쪽은 지금 약의 성능이에요. 줄을 누르면 설명이 열리고, 개발할 때마다 <b class="good">초록</b>(좋아짐)이나 <b class="warn">주황</b>(나빠짐)으로 깜빡여요. <b>투여량</b>을 올리면 찌꺼기가 빨리 지워지지만 <b class="warn">부작용</b>(뇌 부종·출혈) 위험이 커져 신뢰도가 깎여요.'},
 {t:'#speed',h:'시작과 경쟁사',b:'게임은 멈춘 채로 시작해요. 오른쪽 아래 재생 버튼이나 스페이스바를 누르면 흘러가요. 위쪽 <b>경쟁사 승인까지</b> 막대가 100%가 되면 경쟁사가 먼저 허가를 받아 최고 등급이 제한돼요.'}];
function coach(i){$$('.hl').forEach(function(e){e.classList.remove('hl');});var c=$('#coach');if(i<0||i>=STEPS.length){c.style.display='none';try{localStorage.setItem('neuroinc.tut','1');}catch(e){}return;}
  var s=STEPS[i];$$(s.t).forEach(function(e){e.classList.add('hl');});
  c.innerHTML='<b>'+s.h+'</b><p>'+s.b+'</p><div class="nav"><button class="btn gh" id="cSkip">닫기</button><span class="dim">'+(i+1)+' / '+STEPS.length+'</span><span>'+(i?'<button class="btn gh" id="cPrev">이전</button> ':'')+'<button class="btn" id="cNext">'+(i===STEPS.length-1?'알겠어요':'다음')+'</button></span></div>';
  c.style.display='block';$('#cSkip').onclick=function(){coach(-1);};$('#cNext').onclick=function(){coach(i+1);};if(i)$('#cPrev').onclick=function(){coach(i-1);};}
$('#bHelp').onclick=function(){if(!blocked()){st.paused=true;coach(0);}};
$('#hintX').onclick=function(){$('#hint').dataset.off='1';};

// ---------- 뇌 지도 ----------
var svg=$('#brain'),NS='http://www.w3.org/2000/svg',regEl={},bubG;
function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);(p||svg).appendChild(e);return e;}
function buildMap(){
  svg.innerHTML='';
  // 뇌 옆모습(오른쪽이 앞). 소뇌·뇌간, 대뇌 외곽, 엽(lobe), 깊은 구조(해마·편도체·내후각피질) 순서로 그린다
  el('path',{d:'M70 214 C84 250 136 268 176 246 C150 242 112 238 92 214Z',fill:'#16222f',stroke:'#2b3d55','stroke-width':2.5});
  [0,1,2,3].forEach(function(i){el('path',{d:'M'+(84+i*14)+' '+(222+i*5)+' C'+(110+i*10)+' '+(236+i*3)+' '+(140+i*8)+' '+(240+i*1)+' '+(160+i*4)+' '+(240-i*0),fill:'none',stroke:'#2b3d55','stroke-width':1.2});});
  el('path',{d:'M176 244 C182 262 184 280 190 292 L212 292 C212 276 214 256 222 246Z',fill:'#16222f',stroke:'#2b3d55','stroke-width':2.5});
  el('path',{d:'M55 150 C50 95 95 48 165 40 C235 30 310 52 348 98 C376 132 372 172 346 192 C332 203 304 202 288 210 C270 222 258 246 222 246 C198 246 186 236 166 240 C138 246 108 236 90 212 C68 194 57 174 55 150Z',fill:'#1c2a3a',stroke:'#3a4a5e','stroke-width':3});
  var LOBE={occ:'M55 150 C50 98 90 56 150 44 C152 80 158 130 166 166 C140 172 110 176 90 200 C68 190 57 172 55 150Z',
   assoc:'M150 44 C185 38 220 36 250 40 C252 80 256 130 262 178 C230 176 196 170 166 166 C158 130 152 80 150 44Z',
   sm:'M250 40 C260 42 270 44 278 46 C280 100 284 170 292 208 C282 204 270 190 262 178 C256 130 252 80 250 40Z',
   pfc:'M278 46 C322 54 362 96 372 140 C376 170 354 192 340 198 C322 204 304 202 292 208 C284 170 280 100 278 46Z',
   itc:'M90 206 C110 178 140 172 166 168 C200 174 240 180 262 182 C272 190 282 200 292 208 C274 220 262 244 224 246 C198 246 186 236 166 240 C138 246 108 236 90 206Z',
   hippo:'M168 218 C180 200 214 198 232 214 C236 218 230 222 226 218 C212 208 190 208 178 224 C172 228 164 224 168 218Z',
   amyg:'M243 213 a12 9 0 1 0 24 0 a12 9 0 1 0 -24 0Z',ento:'M221 232 a11 7 0 1 0 22 0 a11 7 0 1 0 -22 0Z'};
  var BASE={occ:'#1f2f40',assoc:'#223445',sm:'#26394c',pfc:'#1f2f40',itc:'#1c2d3d',hippo:'#2d4660',amyg:'#2d4660',ento:'#2d4660'};
  var ORDER=['occ','assoc','sm','pfc','itc','ento','hippo','amyg'],R={};REGIONS.forEach(function(r){R[r.id]=r;});
  var SZ={occ:30,assoc:34,sm:20,pfc:36,itc:30,hippo:14,amyg:10,ento:9};
  // 시냅스 경로(점선)
  REGIONS.forEach(function(r){r.to.forEach(function(t){var o=R[t];el('line',{x1:r.xy[0],y1:r.xy[1],x2:o.xy[0],y2:o.xy[1],stroke:'#5d7390','stroke-width':1.6,'stroke-dasharray':'4 4',opacity:.7});});});
  // 대뇌 주름(장식)
  ['M110 90 C130 80 150 96 170 84','M180 70 C200 60 224 76 240 62','M290 80 C310 70 330 86 350 100','M300 150 C320 140 340 152 358 150','M96 160 C112 150 128 160 146 152','M190 150 C210 140 232 152 250 146','M120 196 C150 188 180 196 210 190'].forEach(function(d){el('path',{d:d,fill:'none',stroke:'#2b3d55','stroke-width':1.4,'stroke-linecap':'round'});});
  ORDER.forEach(function(id){var r=R[id],deep=SZ[id]<15;
    el('path',{d:LOBE[id],fill:BASE[id],'fill-opacity':deep?1:.55,stroke:deep?'#4a6a8a':'#3a4a5e','stroke-width':deep?1.8:1.4});});
  // 위에 덮는 타우 층 + 아밀로이드 점 + 숫자
  ORDER.forEach(function(id){var r=R[id],g=el('g',{}),deep=SZ[id]<15;
    var c=el('path',{d:LOBE[id],fill:'#e0242b','fill-opacity':0,stroke:'#e0242b','stroke-width':deep?2:2.4,'stroke-opacity':0},g);
    var amy=el('g',{},g);
    var t=el('text',{x:r.xy[0],y:r.xy[1]+4,'text-anchor':'middle',fill:'#fff','font-size':deep?10:13,'font-weight':900,'pointer-events':'none','paint-order':'stroke',stroke:'#0a1220','stroke-width':3},g);
    regEl[id]={c:c,t:t,ring:c,amy:amy,n:-1,sz:SZ[id]};});
  // 이름표
  var LAB={occ:[88,150,'후두엽'],assoc:[205,128,'두정 연합'],sm:[264,122,'감각운동'],pfc:[325,158,'전두엽'],itc:[130,226,'하측두엽'],hippo:[196,194,'해마'],amyg:[262,196,'편도체'],ento:[232,244,'내후각']};
  Object.keys(LAB).forEach(function(k){el('text',{x:LAB[k][0],y:LAB[k][1],'text-anchor':'middle',fill:'#9db3c9','font-size':8.5,'font-weight':700,'pointer-events':'none','paint-order':'stroke',stroke:'#0a1220','stroke-width':2.5},svg).textContent=LAB[k][2];});
  bubG=el('g',{});
}
buildMap();

// ---------- 개발 트리 ----------
function depth(id,tr,memo){if(memo[id]!==undefined)return memo[id];var n=NODE[id],d=0;n.req.concat(n.reqAny).forEach(function(r){if(NODE[r].tree===tr)d=Math.max(d,depth(r,tr,memo)+1);});return memo[id]=d;}
function nState(n){if(st.owned.indexOf(n.id)>=0)return 'own';if(st.pipeline.some(function(p){return p&&p.nodeId===n.id;}))return 'run';var cb=canBuy(st,n.id);if(cb.ok)return 'buy';if(cb.why.some(function(w){return w.indexOf('배타')===0;}))return 'x';return 'lock';}
function renderTree(){
  $$('#evoTabs .pill').forEach(function(b){b.classList.toggle('on',b.dataset.t===tab);});
  $$('#cats .rbtn').forEach(function(b){b.classList.toggle('on',b.dataset.t===tab&&$('#evoOv').classList.contains('show'));});
  $('#evoRp').textContent='연구점수 '+Math.floor(st.rp)+'';
  var list=NODES.filter(function(n){return n.tree===tab;}),memo={},cols={},pos={},maxC=0,maxR=0;
  list.forEach(function(n){var d=depth(n.id,tab,memo);cols[d]=(cols[d]||0)+1;pos[n.id]=[d,cols[d]-1];maxC=Math.max(maxC,d);maxR=Math.max(maxR,cols[d]);});
  var W=70+(maxC+1)*130,H=60+maxR*105,h='<svg width="'+W+'" height="'+H+'">';
  list.forEach(function(n){n.req.concat(n.reqAny).forEach(function(r){if(!pos[r])return;var a=pos[r],b=pos[n.id];h+='<line x1="'+(50+a[0]*130+32)+'" y1="'+(30+a[1]*105+32)+'" x2="'+(50+b[0]*130+32)+'" y2="'+(30+b[1]*105+32)+'" stroke="'+(st.owned.indexOf(r)>=0?'#3fe08a':'#3a4a5e')+'" stroke-width="4"/>';});});
  h+='</svg>';
  list.forEach(function(n){var s=nState(n),p=pos[n.id],c=nodeCost(st,n.id);
    h+='<button class="nd '+s+(n.id===selId?' sel':'')+'" data-id="'+n.id+'" style="left:'+(50+p[0]*130)+'px;top:'+(30+p[1]*105)+'px">'+ico(n.id,30)+(s==='own'?'':'<span class="cost">'+c.rp+'</span>')+'<span class="nm">'+EASY[n.id][0]+'</span></button>';});
  $('#tree').style.width=W+'px';$('#tree').style.height=H+'px';$('#tree').innerHTML=h;
  $$('#tree .nd').forEach(function(b){b.onclick=function(){selId=b.dataset.id;renderTree();renderDesc();};});
  renderDesc();
}
function leadsTo(id,t){var n=NODE[t];return n.req.concat(n.reqAny).some(function(r){return r===id||leadsTo(id,r);});}
// 개발하면 약이 어떻게 달라지는지 계산해 보여 줘요(실험실 groupPreview와 같은 방식). 연구점수 수입처럼 이 네 수치에 안 잡히는 효과는 위 설명에 있어요
function nodePreview(id){var cur=derive(st),o2=st.owned.concat([id]),c2=st.combos.slice();
  COMBOS.forEach(function(c){if(c2.indexOf(c.id)<0&&c.req.every(function(r){return o2.indexOf(r)>=0;}))c2.push(c.id);});
  var nd=computeDrug(st.company,o2,c2,st.groups),nv=derive(Object.assign({},st,{drug:nd}));
  return '<div class="pv">개발하면: 뇌 장벽 통과 '+pvTxt(st.drug.uptake,nd.uptake,'%p',true)+' · 표적에 붙는 정도 '+pvTxt(cur.theta*100,nv.theta*100,'%p',true)+' · 찌꺼기 제거 '+pvTxt(cur.clear*100,nv.clear*100,'%p/주',true)+' · 부작용 위험 '+pvTxt(cur.aria*100,nv.aria*100,'%p',false)+'</div>'+
   (st.drug.type==='ab'&&(id==='A1'||id==='A2'||id==='A3')?'<div class="pv dim">항체 약에는 이 단계만으로는 효과가 거의 없어요.'+(leadsTo(id,'A6')?' 「'+EASY.A6[0]+'」로 가는 길을 열어 줘요.':'')+'</div>':'');}
function whyTxt(w){var m=w.match(/^선행: (\w+)$/),x;if(m)return '먼저 「'+EASY[m[1]][0]+'」 필요';
  m=w.match(/^선행\(택1\): (.*)$/);if(m)return '다음 중 하나 필요: '+m[1].split(' 또는 ').map(function(x){return '「'+EASY[x][0]+'」';}).join(', ');
  m=w.match(/^배타: (\w+)$/);if(m)return qeul(EASY[m[1]][0])+' 이미 골라서 고를 수 없어요';return w;}
function renderDesc(){
  if(!selId){return;}
  var n=NODE[selId],e=EASY[selId],s=nState(n),cb=canBuy(st,selId),c=nodeCost(st,selId);
  var why='';if(s==='lock'||s==='x'){why='<div class="rule" style="margin:6px 0 0"><b class="warn">아직 못 사요</b> '+cb.why.map(whyTxt).join(' / ')+'</div>';}
  $('#desc').innerHTML='<h3>'+ico(n.id,20)+' '+e[0]+' <span class="dim" style="font-size:12px">['+CAT[n.tree][0]+']</span>'+(n.dH?' <span class="dim" style="font-size:12px">합성 필요(시간 걸림)</span>':' <span class="dim" style="font-size:12px">즉시 적용</span>')+'</h3>'+e[1]+
   '<div><span class="g">좋은 점 '+e[2]+'</span> &nbsp; <span class="r">대가 '+e[3]+'</span></div><div class="dim" style="margin-top:3px">비용: '+costStr(c)+'</div>'+(s==='buy'||s==='lock'?nodePreview(selId):'')+why+
   '<details><summary>전문 용어로 / 실제 사례</summary><div>'+n.gain+' · '+n.tradeoff+'<br>'+n.concept+'</div></details>';
  var aff=st.rp>=c.rp;$('#evoGo').disabled=!(s==='buy'&&aff);$('#evoGo').textContent=s==='own'?'보유 중':s==='run'?'합성 중':s==='buy'&&!aff?'연구점수 부족':'개발하기';
}
$('#evoGo').onclick=function(){if(selId)onNode(selId);};
['A','B','C'].forEach(function(t){var b=document.createElement('button');b.className='pill';b.dataset.t=t;b.innerHTML=ico(CAT[t][2],18)+' '+CAT[t][0]+' <span style="font-weight:600;font-size:12px">'+CAT[t][1]+'</span>';b.style.display='inline-flex';b.style.gap='6px';b.style.alignItems='center';b.onclick=function(){tab=t;selId=null;renderTree();$('#desc').innerHTML=DESC0;$('#evoGo').disabled=true;$('#evoGo').textContent='개발하기';};$('#evoTabs').appendChild(b);});
function openEvo(t){if(blocked())return;if(t)tab=t;$('#evoOv').classList.add('show');renderTree();}
function closeEvo(){$('#evoOv').classList.remove('show');$$('#cats .rbtn').forEach(function(b){b.classList.remove('on');});}
$('#bEvo').onclick=function(){var r=st&&nextRec();openEvo(r?NODE[r[0]].tree:undefined);}; /* 추천 항목이 있는 갈래를 열어요 */ $('#evoX').onclick=closeEvo;
$$('#cats .rbtn').forEach(function(b){b.innerHTML=ico(CAT[b.dataset.t][2],26)+'<small>'+CAT[b.dataset.t][0]+'</small>';b.onclick=function(){openEvo(b.dataset.t);};});

// ---------- 합성 조건 선택 ----------
function onNode(id){
  var n=NODE[id],cb=canBuy(st,id);if(!cb.ok){refuse(EASY[id][0]+' 개발 불가: '+cb.why.map(whyTxt).join(', '));return;}
  if(n.dH===0){var r=buy(st,id);if(r!==true)refuse(r);renderTree();return;}
  var c=nodeCost(st,id),prot=isProtein(st,n);
  var cu=st.pipeline.filter(function(p){return p&&p.cond==='cool';}).length,hu=st.pipeline.filter(function(p){return p&&p.cond==='heat';}).length;
  $('#pickBox').innerHTML='<h2>'+EASY[id][0]+', 어떻게 만들까요?</h2><p>알맞게 고르면 평형이 생성물 쪽으로 기울어 같은 시간에 더 많이 얻어요. 그래서 개발이 빨리 끝나요. 틀리면 느려져요.</p>'+
   '<div class="rule"><b>지금 상황</b><br>· 이 반응은 <b>'+(n.dH<0?'열을 내는(발열)':'열을 먹는(흡열)')+'</b> 반응이에요<br>· <b>'+(st.drug.type!=='ab'?'지금 만드는 약은 작은 분자예요. 데워도 괜찮아요.':prot?'항체(단백질) 부분이에요. 데우면 망가져요.':'이 단계는 단백질이 아닌 부분을 만들어요. 데워도 괜찮아요.')+'</b><br>· 냉각기 '+cu+'/2 사용 중 · 가열기 '+hu+'/2 사용 중</div>'+
   '<div class="rule"><b>고르는 법</b> 첫째, 열을 내는 반응은 식히고, 열을 먹는 반응은 데우면 잘 돼요 (르샤틀리에 원리). 둘째, 단백질(항체) 부분을 만드는 단계는 데우면 망가지니 항상 식히세요. 셋째, 냉각기·가열기는 2대뿐이라 꽉 차면 효율이 떨어져요. 이럴 땐 실험실에서 만든 아세트산(촉매)이 도움이 돼요. 넷째, 에탄올 용매는 작은 분자 약엔 득, 항체엔 독이에요.</div>'+
   ['cool','heat','catalyst'].map(function(k){var no=k==='catalyst'&&st.lab.acetic<1;return '<button class="ch" data-c="'+k+'"'+(no?' disabled':'')+'>'+CONDK[k]+'<small>'+({cool:'식혀서 반응시키기',heat:'데워서 반응시키기',catalyst:'아세트산 1개로 속도 올리기 ('+(no?'아세트산이 없어요':'보유 '+st.lab.acetic)+')<br>실제 촉매는 반응 뒤에도 그대로 남지만, 이 게임에서는 한 번 쓰면 없어져요.'})[k]+'</small></button>';}).join('')+
   '<label class="rule" style="display:flex;gap:8px;align-items:center;margin-top:8px;min-height:54px"><input type="checkbox" id="solv"> 에탄올 용매 쓰기 (보유 '+st.lab.ethanol+')</label><button class="btn gh" data-c="" style="margin-top:6px">취소</button> <span class="dim" style="font-size:12px">'+costStr(c)+'</span>';
  $('#pick').classList.add('show');
  $$('#pickBox [data-c]').forEach(function(b){b.onclick=function(){$('#pick').classList.remove('show');if(!b.dataset.c)return;var sv=$('#solv')&&$('#solv').checked;var r=buy(st,id,b.dataset.c,sv);if(r!==true)refuse(r);else sfx('start');renderTree();};});
}

// ---------- 합성 실험실 ----------
var DESC0=$('#desc').innerHTML;
var labEl=document.createElement('div');labEl.className='ov';labEl.id='labOv';labEl.innerHTML='<div class="card"><div class="in" id="labBox"></div></div>';$('#stage').insertBefore(labEl,$('#event'));function closeLab(){labEl.classList.remove('show');}
function pvTxt(a,b,unit,goodUp){var d=b-a;if(Math.abs(d)<.005)return '변화 없음';var s=(d>0?'+':'')+d.toFixed(2)+unit;return '<span class="'+((d>0)===goodUp?'u':'d')+'">'+s+'</span>';}
function groupPreview(id){if(!GROUPS[id]||st.groups.indexOf(id)>=0||st.groups.length>=K.MAX_GROUPS)return '';var cur=derive(st),nd=computeDrug(st.company,st.owned,st.combos,st.groups.concat([id])),nv=derive(Object.assign({},st,{drug:nd}));
  return '<div class="pv">붙이면: 뇌 장벽 통과 '+pvTxt(st.drug.uptake,nd.uptake,'%p',true)+' · 표적에 붙는 정도 '+pvTxt(cur.theta*100,nv.theta*100,'%p',true)+' · 부작용 위험 '+pvTxt(cur.aria*100,nv.aria*100,'%p',false)+'</div>';}
// 구조식: 격자 위에 원자 글자와 결합선. 원자 [원소,열,행,작용기여부], 결합 [원자a,원자b,차수]. 작용기 원자는 호박색, 이름표는 글자로도 알려 줘요.
var STRUCT={
 ethanol:{a:[['C',1,1],['C',2,1],['O',3,1,1],['H',4,1,1],['H',0,1],['H',1,0],['H',1,2],['H',2,0],['H',2,2]],b:[[0,1],[1,2],[2,3],[0,4],[0,5],[0,6],[1,7],[1,8]]},
 acetic:{a:[['C',1,1],['C',2,1,1],['O',2,0,1],['O',3,1,1],['H',4,1,1],['H',0,1],['H',1,0],['H',1,2]],b:[[0,1],[1,2,2],[1,3],[3,4],[0,5],[0,6],[0,7]]},
 ammonia:{a:[['N',1,1,1],['H',0,1],['H',2,1,1],['H',1,2,1]],b:[[0,1],[0,2],[0,3]]},
 amide:{a:[['C',1,1],['C',2,1,1],['O',2,0,1],['N',3,1,1],['H',4,1,1],['H',3,2,1],['H',0,1],['H',1,0],['H',1,2]],b:[[0,1],[1,2,2],[1,3],[3,4],[3,5],[0,6],[0,7],[0,8]]}};
function structSVG(id,size,label){
  var S=STRUCT[id],CL=44,W=216,H=132,x0=9,x1=0,y0=9,y1=0,i;
  S.a.forEach(function(p){x0=Math.min(x0,p[1]);x1=Math.max(x1,p[1]);y0=Math.min(y0,p[2]);y1=Math.max(y1,p[2]);});
  var ox=(W-(x1-x0)*CL)/2-x0*CL,oy=(H-(y1-y0)*CL)/2-y0*CL,P=S.a.map(function(p){return [p[1]*CL+ox,p[2]*CL+oy];}),AM='var(--amber)',TX='var(--txt)',s='';
  S.b.forEach(function(b){var A=P[b[0]],B=P[b[1]],dx=B[0]-A[0],dy=B[1]-A[1],d=Math.sqrt(dx*dx+dy*dy),ux=dx/d,uy=dy/d,r=12,n=b[2]||1,g=S.a[b[0]][3]&&S.a[b[1]][3];
    for(i=0;i<n;i++){var o=n===1?0:(i?3.5:-3.5);s+='<line x1="'+(A[0]+ux*r-uy*o).toFixed(1)+'" y1="'+(A[1]+uy*r+ux*o).toFixed(1)+'" x2="'+(B[0]-ux*r-uy*o).toFixed(1)+'" y2="'+(B[1]-uy*r+ux*o).toFixed(1)+'" style="stroke:'+(g?AM:TX)+'" stroke-width="2.6" stroke-linecap="round"/>';}});
  S.a.forEach(function(p,k){s+='<text x="'+P[k][0].toFixed(1)+'" y="'+P[k][1].toFixed(1)+'" text-anchor="middle" dominant-baseline="central" font-size="21" font-weight="800" style="fill:'+(p[3]?AM:TX)+'">'+p[0]+'</text>';});
  var h=H+(label?22:0);
  if(label)s+='<text x="'+W/2+'" y="'+(H+11)+'" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="800" style="fill:'+AM+'">'+GROUPS[id].ko+'</text>';
  return '<svg role="img" aria-label="'+(label?LAB[id].ko+'의 구조식, 작용기는 '+GROUPS[id].ko:'이름을 맞힐 화합물의 구조식, 분자식 '+LAB[id].f)+'" width="'+size+'" height="'+Math.round(size*h/W)+'" viewBox="0 0 '+W+' '+h+'" style="flex:none">'+s+'</svg>';}
// 처음 합성할 때 이름 맞히기 (열려 있는 동안 게임 시간이 멈춰요)
var QZ={
 ethanol:{o:['에탄올','메탄올','아세트산','다이메틸 에터'],y:'탄소 2개 사슬 끝에 하이드록시기(-OH)가 붙은 알코올이에요. 탄소가 1개면 메탄올이에요.'},
 acetic:{o:['아세트산','폼산','에탄올','아세톤'],y:'메틸기(-CH3)에 카복실기(-COOH)가 붙은, 탄소 2개짜리 산이에요. 식초의 신맛을 내요.'},
 ammonia:{o:['암모니아','메테인','물','하이드라진'],y:'질소 1개에 수소 3개가 붙었어요. 수소 하나가 빠진 자리(-NH2, 아미노기)로 다른 분자와 이어져요.'},
 amide:{o:['아세트아마이드','아세트산','요소','메틸아민'],y:'카보닐기(C=O) 바로 옆에 질소가 붙은 아마이드 결합이 있어요. 단백질의 펩타이드 결합과 같은 종류예요.'}};
var quizEl=document.createElement('div');quizEl.className='ov';quizEl.id='quizOv';quizEl.innerHTML='<div class="card"><div class="in" id="quizBox"></div></div>';$('#stage').insertBefore(quizEl,$('#event'));
function iyo(n){var c=n.charCodeAt(n.length-1)-44032;return n+((c%28)?'이에요':'예요');}
function closeQuiz(){quizEl.classList.remove('show');if(st)renderLab();}
function openQuiz(id){var q=QZ[id],o=q.o.slice(),i,j,t;for(i=o.length-1;i>0;i--){j=Math.floor(Math.random()*(i+1));t=o[i];o[i]=o[j];o[j]=t;}
  $('#quizBox').innerHTML='<h2 style="margin-top:0">이 구조의 이름은?</h2><div style="display:flex;gap:20px;align-items:center;margin-bottom:6px">'+structSVG(id,300,false)+'<div class="dim" style="font-size:16px">분자식 <b style="color:var(--txt);font-size:22px">'+fm(LAB[id].f)+'</b></div></div>'+
   o.map(function(n){return '<button class="ch" data-n="'+n+'" style="min-height:54px;font-size:16px;font-weight:800">'+n+'</button>';}).join('')+'<div style="text-align:right;margin-top:8px"><button class="btn gh" id="quizX">그만두기</button></div>';
  $$('#quizBox [data-n]').forEach(function(b){b.onclick=function(){var ok=b.dataset.n===LAB[id].ko,res=labCraft(st,id,ok);if(res!==true){refuse(res);closeQuiz();return;}sfx(ok?'good':'bad');
    $('#quizBox').innerHTML='<h2 style="margin-top:0" class="'+(ok?'good':'warn')+'">'+(ok?'맞아요! '+iyo(LAB[id].ko)+'.':'아쉬워요. 정답은 '+iyo(LAB[id].ko)+'.')+'</h2><div style="display:flex;gap:20px;align-items:center">'+structSVG(id,300,true)+'<div><b style="font-size:20px">'+LAB[id].ko+'</b> <span class="dim">'+fm(LAB[id].f)+'</span><p style="margin:8px 0">'+q.y+'</p><p style="margin:0"><b class="'+(ok?'good':'warn')+'">도감에 올리고 연구점수 '+(ok?K.DISC_RP+'을':K.DISC_RP_MISS+'를')+' 받았어요</b></p></div></div><div style="text-align:right;margin-top:10px"><button class="btn" id="quizOk">확인</button></div>';
    $('#quizOk').onclick=closeQuiz;$('#quizOk').focus();};});
  $('#quizX').onclick=closeQuiz;quizEl.classList.add('show');var qc=quizEl.querySelector('.card');qc.setAttribute('tabindex','-1');qc.focus();} // 포커스는 카드에 둬서 창이 뜬 직후 스페이스나 엔터로 답이 골라지지 않아요
function renderLab(){
  var nd=Object.keys(st.disc||{}).length,nl=Object.keys(LAB).length;
  var h='<h2 style="margin-top:0">합성 실험실</h2><p class="dim" style="margin:0 0 4px">원료(탄소·수소·산소·질소)로 화합물을 만들어요. 만든 화합물은 <b>합성할 때 재료</b>로 쓰거나, <b>약에 작용기로 붙여</b> 성능을 바꿀 수 있어요. 작용기는 '+K.MAX_GROUPS+'개까지, 한 번 붙이면 떼지 못해요.</p><p class="dim" style="margin:0 0 4px">조합 효과(게임 규칙): 하이드록시기와 카복실기를 함께 붙이면 에스터 결합으로 보고 붙는 힘이 늘어요. 아미노기와 카복실기를 함께 붙이면 아마이드 결합으로 보고 머무는 시간이 늘어요. 처음 합성할 때는 구조를 보고 이름을 맞혀요. 맞히면 연구점수 '+K.DISC_RP+', 틀려도 '+K.DISC_RP_MISS+'를 받고 도감에 올라요. 도감 <b>'+nd+'/'+nl+'</b></p>'+
   '<div class="rule" style="margin:4px 0">시약 주문: 연구점수 '+ro(orderCost(st))+' 원료 '+K.ORDER_ATOMS+'개 (주문할수록 비싸져요) '+['C','H','O','N'].map(function(a){return '<button class="btn gh" data-o="'+a+'" style="padding:8px 14px;font-size:13px">'+ATOM[a]+'</button>';}).join(' ')+'</div><div class="stock" style="margin:4px 0 6px">내 원료 '+['C','H','O','N'].map(function(a){return '<span class="sk">'+ATOM[a]+' <b>'+st.atoms[a]+'</b></span>';}).join('')+' <span style="margin-left:auto">붙인 작용기 <b>'+st.groups.length+'/'+K.MAX_GROUPS+'</b></span></div>';
  h+='<div class="labgrid">';
  Object.keys(LAB).forEach(function(id){var x=LAB[id],can=true,known=!!(st.disc||{})[id],att=st.groups.indexOf(id)>=0,rows=Object.keys(x.atoms).map(function(a){var have=st.atoms[a],need=x.atoms[a],ok=have>=need;if(!ok)can=false;return '<tr><td>'+ATOM[a]+'</td><td>'+need+'</td><td>'+have+'</td>'+(ok?'<td>'+(have-need)+'</td>':'<td class="no">'+(need-have)+'개 부족</td>')+'</tr>';}).join('');
    h+='<div class="rule lab" data-id="'+id+'"><div class="t1"><b>'+(known?x.ko:fm(x.f))+'</b>'+(known?' <span class="dim">'+fm(x.f)+'</span>':'')+'<span class="good">보유 '+st.lab[id]+'개</span></div>'+
     '<div class="r1">'+structSVG(id,165,known)+'<div><div style="margin:0 0 3px">'+x.use+'</div>'+(known?'':'<div class="dim" style="margin:0 0 3px">처음 합성하면 이름을 맞혀 도감에 올려요</div>')+groupPreview(id)+'</div></div>'+
     '<div class="r2"><table class="lt"><tr><th></th><th>필요</th><th>보유</th><th>합성 후</th></tr>'+rows+'</table><div class="lbtn"><button class="btn" data-a="mk" '+(can?'':'disabled')+'>합성하기</button><button class="btn gh" data-a="at" '+((st.lab[id]<1||att||st.groups.length>=K.MAX_GROUPS)?'disabled':'')+'>'+(att?'이미 붙였어요':'약에 붙이기: '+GROUPS[id].ko)+'</button></div></div></div>';});
  h+='</div><div style="text-align:right;margin-top:6px"><button class="btn" id="labX">닫기</button></div>';
  $('#labBox').innerHTML=h;$('#labX').onclick=closeLab;
  $$('#labBox [data-o]').forEach(function(b){b.onclick=function(){var res=labOrder(st,b.dataset.o);if(res!==true)refuse(res);else sfx('tap');renderLab();};});
  $$('#labBox .lab').forEach(function(d){d.querySelectorAll('button[data-a]').forEach(function(b){b.onclick=function(){var id=d.dataset.id;
    if(b.dataset.a==='mk'&&!(st.disc||{})[id]){openQuiz(id);return;}
    var res=b.dataset.a==='mk'?labCraft(st,id):labAttach(st,id);if(res!==true)refuse(res);else sfx(b.dataset.a==='mk'?'done':'start');renderLab();};});});
}
function openLab(){if(blocked())return;labEl.classList.add('show');renderLab();}
document.addEventListener('click',function(e){if(e.target&&e.target.id==='bLab')openLab();});
function burst(el){if(calm())return;try{var r=el.getBoundingClientRect(),n=10;for(var i=0;i<n;i++){var p=document.createElement('i');p.className='spk';var a=i/n*6.283,d=30+Math.random()*30;p.style.left=(r.left+r.width/2)+'px';p.style.top=(r.top+r.height/2)+'px';p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d+'px');document.body.appendChild(p);setTimeout((function(q){return function(){if(q.parentNode)q.parentNode.removeChild(q);};})(p),700);}}catch(e){}}
// ---------- 임상 시험 ----------
var trEl=document.createElement('div');trEl.className='ov';trEl.id='trOv';trEl.innerHTML='<div class="card"><div class="in" id="trBox"></div></div>';$('#stage').insertBefore(trEl,$('#event'));function closeTr(){trEl.classList.remove('show');}
function pc(x){return (x>=0?'+':'')+Math.round(x*100)+'%';}
// 시험 예상 한 줄. 판정은 엔진의 trialForecast 하나만 써서 예상과 실제 결과가 어긋나지 않아요
function trialLine(fc){var need=Math.round(fc.need*100),from=fc.first?'시작할 때보다':'지난 시험보다';
  if(fc.pass)return '지금 시험하면 통과할 수 있어요.';
  if(fc.score>=K.TRIAL_OK)return from+' 나아진 게 없어요. 약은 충분히 좋으니 조금이라도 더 좋아지면 통과해요.';
  return from+' '+(fc.gain>0?pc(fc.gain)+' 좋아졌어요.':'나아진 게 없어요.')+' 통과하려면 +'+need+'%가 필요해요.';}
function ariaLv(a){var p=a*400;return p<=25?2:p<=60?1:0;} // HUD의 부작용 위험 판정과 같은 기준
function rivPc(){return Math.round((K.TRIAL_RIVAL-1)*100);}
function showTrial(rep){var d=st.drug,dv=derive(st);
  function row(n,v,lv,lab){return '<div class="tr-row"><span>'+n+'</span><b class="'+['v-b','v-w','v-g'][lv]+'">'+v+' · '+(lab||['부족','보통','좋음'])[lv]+'</b></div>';}
  var up=Math.log10(d.uptake*10+1)/3*100,th=dv.theta*100,cl=dv.clear/.1*100,L=function(p){return p>=40?2:p>=15?1:0;};
  $('#trBox').innerHTML='<h2 style="margin-top:0">임상 시험 '+rep.num+'차 결과 <span class="'+(rep.pass?'tr-pass':'tr-fail')+'">'+(rep.pass?'통과':'미통과')+'</span></h2>'+
   row('뇌 장벽 통과율',d.uptake.toFixed(2)+'%',L(up))+row('표적에 붙는 정도',(dv.theta*100).toFixed(0)+'%',L(th))+row('찌꺼기 제거 속도',(dv.clear*100).toFixed(2)+'%/주',L(cl))+row('부작용 위험(월)',(dv.aria*100).toFixed(1)+'%',ariaLv(dv.aria),['높음','보통','낮음'])+
   '<div class="rule">'+(rep.pass?'<b>'+(rep.first?'시작할 때보다':'지난 시험보다')+' 나아졌어요</b> (종합 점수 '+pc(rep.gain)+'). 신뢰도 +8, 연구점수 +'+rep.reward+'. 경쟁사 속도 '+rivPc()+'% 증가.':'<b>이유</b> '+(rep.first?'시작할 때 약보다 '+Math.round(rep.need*100)+'% 이상 좋아져야 해요.':rep.gain<=0?'지난 시험보다 나아진 게 없어요.':pc(rep.gain)+' 좋아졌지만 통과하려면 +'+Math.round(rep.need*100)+'%가 필요해요.')+(rep.key==='ok'?'':' 가장 약한 곳: '+rep.ko+'.'))+'<br><b>다음 설계</b> '+rep.tip+'</div>'+
   '<p class="dim">다음 시험은 '+K.TRIAL_CD+'주 뒤에 할 수 있고, 비용은 연구점수 '+trialCost(st)+'점이에요. '+(rep.pass?'약을 더 좋게 만들면 다음 시험도 통과할 수 있어요.':'약을 바꾸고 다시 도전하세요.')+'</p><div style="text-align:right"><button class="btn" id="trX">닫기</button></div>';
  trEl.classList.add('show');$('#trX').onclick=closeTr;}
function doTrial(){var r=runTrial(st);if(!r.ok)refuse(r.msg);else{sfx(r.rep.pass?'pass':'fail');showTrial(r.rep);if(r.rep.pass)burst($('#trOv .card'));}}
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#bTrial')&&!blocked()){
  var m=trialBlock(st);if(m){refuse(m);return;}
  var fc=trialForecast(st);if(fc.pass){doTrial();return;}
  dlg('지금 시험하면 통과하기 어려워요',(fc.first?'시작할 때와 비교해 ':'지난 시험과 비교해 ')+(fc.gain<=0?'나아진 게 없어요. 통과하려면 +'+Math.round(fc.need*100)+'%가 필요해요.':'지금 개선 폭은 '+pc(fc.gain)+'예요. 통과하려면 +'+Math.round(fc.need*100)+'%가 필요해요.')+(fc.rep.key==='ok'?'':'\n가장 약한 곳: '+fc.rep.ko+'.')+'\n미통과여도 연구점수 '+eul(K.TRIAL_CONSOL)+' 받지만 다음 시험까지 '+eul(K.TRIAL_CD+'주')+' 기다려야 해요.',[['그만두기',null,1],['그래도 시험하기',doTrial]]);}});
// ---------- 이벤트 ----------
function showEvent(){
  var ev=EVENTS.filter(function(e){return e.id===st.event.id;})[0];resumeAfter=!st.paused;st.paused=true;evOpen=true;sfx('alert');
  $('#evHd').textContent='속보 · '+ev.title;
  $('#evBox').innerHTML='<p style="font-size:16px;margin-top:0">'+ev.text+'</p>'+(ev.real?'<div class="rule"><b>실제 배경</b> '+ev.real+' <span class="dim">(이 게임의 수치·결과는 가상)</span></div>':'')+
   ev.ch.map(function(c,i){return '<button class="ch" data-i="'+i+'">'+c.l+'<small>'+c.d+'</small></button>';}).join('');
  
  $('#event').classList.add('show');
  $$('#evBox [data-i]').forEach(function(b){b.onclick=function(){
    var i=+b.dataset.i,best=st.event.best;resolveEvent(st,i);var lg=st.log[st.log.length-1];
    $('#evBox').innerHTML='<h2 class="'+(lg.good?'good':'bad')+'">'+(lg.good?'좋은 선택이었어요':'아쉬운 선택이었어요')+'</h2><p>'+clean(st.news[0])+'</p>'+
      (lg.good?'':'<div class="rule"><b>이번 상황의 정답</b> '+lg.best+'<br>'+lg.why+'</div>')+'<div style="text-align:right"><button class="btn" id="evOk">계속</button></div>';
    $('#evOk').onclick=function(){$('#event').classList.remove('show');evOpen=false;st.paused=!resumeAfter;if(resumeAfter)st.paused=false;};
    sfx(lg.good?'good':'bad');};});
}

// ---------- 컨트롤 ----------
$('#dose').oninput=function(){if(blocked()){this.value=st?st.dose:5;return;}st.dose=+this.value;};
function toggle(){if(blocked()||evOpen)return;st.paused=!st.paused;}
function setSpeed(n){if(blocked()||evOpen)return;st.speed=n;st.paused=false;}
$('#bPause').onclick=toggle;
$$('[data-sp]').forEach(function(b){b.onclick=function(){setSpeed(+b.dataset.sp);};});
$('#x4').onclick=function(){if(!blocked())useEarly(st);};
// ---------- 메뉴(잠시 멈춤), 처음 화면, 다시 하기 ----------
function menuOpen(){return $('#menu').classList.contains('show');}
function openMenu(){if(!st||st.over||evOpen||st.event||$$('.ov.show').length)return;menuWas=!st.paused;st.paused=true;renderMenu();$('#menu').classList.add('show');var f=$('#menuBox .ch');if(f)f.focus();}
function closeMenu(keep){if(!menuOpen())return;$('#menu').classList.remove('show');if(st&&!keep)st.paused=!menuWas;menuWas=false;}
function renderMenu(){var M=[['go','이어 하기',''],['again','처음부터 다시','같은 설정으로 새로 시작해요'],['home','처음 화면으로','난이도와 회사를 다시 골라요'],['snd',muted?'소리 끔':'소리 켬',muted?'누르면 소리가 켜져요':'누르면 소리가 꺼져요'],['help','도움말','사용법 안내를 다시 봐요'],['about','출처와 안내','']];
  $('#menuBox').innerHTML='<h2 style="margin:0">잠시 멈춤</h2>'+M.map(function(m){return '<button class="ch" data-m="'+m[0]+'">'+m[1]+(m[2]?'<small>'+m[2]+'</small>':'')+'</button>';}).join('');
  $$('#menuBox [data-m]').forEach(function(b){b.onclick=function(){menuDo(b.dataset.m);};});}
function menuDo(k){
  if(k==='go')closeMenu();
  else if(k==='again')dlg('처음부터 다시 할까요?','지금 판은 끝나요. 같은 회사, 난이도, 시나리오로 새로 시작해요.',[['취소',null,1],['처음부터 다시',again]]);
  else if(k==='home')dlg('처음 화면으로 갈까요?','지금 판은 끝나요. 난이도와 회사를 다시 골라요.',[['취소',null,1],['처음 화면으로',goHome]]);
  else if(k==='snd'){muted=!muted;try{localStorage.setItem('neuroinc.mute',muted?'1':'0');}catch(e){}renderMenu();var s=$('#menuBox [data-m=snd]');if(s)s.focus();}
  else if(k==='help'){closeMenu(true);coach(0);}
  else if(k==='about')dlg('출처와 안내','글꼴은 Noto Sans KR이고 SIL Open Font License 1.1로 쓸 수 있어요. Google Fonts에서 불러와요.\n효과음은 Kenney(kenney.nl)의 Interface Sounds와 Music Jingles예요. Creative Commons Zero로 공개되어 누구나 쓸 수 있어요.\n게임의 틀은 Plague Inc.(Ndemic Creations)를 참고했어요. 그 회사와는 관련이 없어요.\n수치는 교육용으로 단순화한 값이에요. 실제 치료 판단에 쓰면 안 돼요.\n사건 카드는 실제 사례에서 영감을 받은 가상 이야기예요.',[['닫기']]);}
$('#bMenu').onclick=openMenu;
// 판이 바뀔 때 모든 화면 상태를 처음 값으로 되돌려요. 영구 설정(소리 끔, 한 번 본 안내 기록)과 디버그 소리 기록은 그대로 둬요
function resetUi(){
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  st=null;acc=0;prev={};selId=null;tab='A';resumeAfter=false;evOpen=false;bubKey='';seenOwned=0;seenAria=0;prevPipe=[];lastOwned=0;tipCur=null;selAdv=null;menuWas=false;
  diff='normal';scn='std';selCo=Object.keys(COMPANIES)[0];syncStart();
  $$('.ov').forEach(function(e){e.classList.remove('show');});dlgB=[];dropTa();
  clearTimeout(noteT);var nt=$('#note');nt.style.display='none';nt.textContent='';clearTimeout(bannerT);var bn=$('#banner');bn.style.display='none';bn.textContent='';
  $('#coach').style.display='none';$('#coach').innerHTML='';var t=$('#tip');t.style.display='none';t.innerHTML='';
  $$('.hl').forEach(function(e){e.classList.remove('hl');});$$('.spk').forEach(function(e){e.parentNode.removeChild(e);});
  $('#danger').classList.remove('on');$('#game').classList.remove('shake');$$('.tflash,.pop').forEach(function(e){e.classList.remove('tflash','pop');});
  ['#hudTop','#mats','#stats','#raw','#goal','#pipe','#trial','#news','#date','#endBox','#evBox','#menuBox','#labBox','#quizBox','#trBox','#pickBox','#tree','#hintT'].forEach(function(s){$(s).innerHTML='';});
  ['#pipe','#trial','#bPause'].forEach(function(s){delete $(s).dataset.h;delete $(s).dataset.k;});delete $('#hint').dataset.off;$('#hint').style.display='none';
  $('#bPause').classList.remove('pulse');$('#bPause').innerHTML='';$('#rp').textContent='0';$('#x4').style.display='none';
  $('#desc').innerHTML=DESC0;$('#evoGo').disabled=true;$('#evoGo').textContent='개발하기';$('#evoRp').textContent='';$$('#cats .rbtn').forEach(function(b){b.classList.remove('on');});
  buildMap();}
function again(){var c=st.company,d=st.diff,s=st.scn,p=st.profile;resetUi();diff=d;scn=s;selCo=c;syncStart();start(c,p);} // 환자군도 같게
function goHome(){resetUi();$('#start').classList.add('show');}
// Esc: 위에 있는 닫을 수 있는 창부터 닫아요. 사건 카드와 끝 화면은 닫지 않아요. [창 id, 닫는 함수]
var CLOSERS=[['small',function(){$('#small').classList.remove('show');}],['dlg',function(){dlgClose(-1);}],['quizOv',closeQuiz],['pick',function(){$('#pick').classList.remove('show');}],['trOv',closeTr],['labOv',closeLab],['evoOv',closeEvo],['menu',function(){closeMenu();}],['coach',function(){coach(-1);}],['tip',function(){if(tipCur){tipDone(tipCur);tipCur=null;}tipHide();}]];
function escClose(){if(!$('#dlg').classList.contains('show')&&($('#event').classList.contains('show')||$('#end').classList.contains('show')))return;
  for(var i=0;i<CLOSERS.length;i++){var e=document.getElementById(CLOSERS[i][0]);if(e&&(e.classList.contains('show')||e.style.display==='block')){CLOSERS[i][1]();return;}}}
addEventListener('keydown',function(e){if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='Escape'){escClose();return;}
  if(!st||$$('.ov.show').length||smallOpen())return;
  if(e.code==='Space'){var a=document.activeElement; // 입력 칸, 글 상자, 요약 줄, 약 성능 줄에서만 스페이스를 그 요소에 맡겨요. 버튼에 포커스가 있어도 멈춤과 계속만 해요
    if(a&&a.matches&&a.matches('input,textarea,summary,.st'))return;e.preventDefault();spaceDown=true;if(!e.repeat)toggle();}
  else if(e.key==='1'||e.key==='2')setSpeed(+e.key);});
addEventListener('keyup',function(e){if(e.code==='Space'&&spaceDown){spaceDown=false;e.preventDefault();}}); // 포커스된 버튼이 스페이스를 떼는 순간 눌리지 않게 해요

// ---------- HUD ----------
function build(){
  $('#hudTop').innerHTML='<div class="gz"><div class="l">인지 기능 <b id="vCog"></b></div><div class="bar"><i id="bCog" style="background:var(--blue)"></i></div></div>'+
   '<div class="gz"><div class="l">신뢰도 <b id="vTr"></b></div><div class="bar"><i id="bTr" style="background:var(--green)"></i></div></div>'+
   '<div class="gz" title="뇌 전체 아밀로이드 평균. 20 미만이 목표"><div class="l">아밀로이드 <b id="vAmy"></b></div><div class="bar"><i id="bAmy" style="background:var(--amber)"></i></div></div>'+
   '<div class="gz" title="100%가 되면 경쟁사가 먼저 허가를 받아요"><div class="l">경쟁사 승인까지 <b id="vRv"></b></div><div class="bar"><i id="bRv" style="background:var(--red)"></i></div></div>';
  $('#mats').innerHTML='<div class="matH">실험실 원료<br><small>화합물 합성에 써요<br>(한정 재고)</small></div>'+['C','H','O','N'].map(function(a){return '<div class="mat" title="'+ATOMTIP+'" id="m'+a+'"><b>'+a+'</b><i>'+ATOM[a]+'</i><span></span></div>';}).join('')+'<button class="btn" id="bLab" style="padding:6px 12px;font-size:13px">실험실 열기</button>';
  
  var rows=[['up','뇌 장벽 통과율','약이 뇌 혈관벽을 넘어 뇌에 들어가는 비율. 높을수록 좋아요.'],['th','표적에 붙는 정도','뇌 속 약 중 병의 원인(아밀로이드)에 실제로 붙는 비율.'],['cl','찌꺼기 제거 속도','아밀로이드를 주당 얼마나 지우나.'],['ts','타우 번짐 속도','1.00이 기본. 낮을수록 타우가 천천히 번져요.'],['ar','부작용 위험 (월)','뇌 부종·출혈 부작용이 생길 위험(월 기준). 높으면 신뢰도가 깎여요.']];
  $('#stats').innerHTML=rows.map(function(r){return '<div class="st" role="button" tabindex="0" aria-expanded="false" id="s_'+r[0]+'"><div class="l"><span>'+r[1]+'</span><b></b></div><div class="bar"><i></i></div><small>'+r[2]+'</small></div>';}).join('');
  $$('#stats .st').forEach(function(e){function tg(){e.setAttribute('aria-expanded',e.classList.toggle('open'));}e.onclick=tg;e.onkeydown=function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();tg();}};});
  seenOwned=st.owned.length;seenAria=st.ariaCount;
  paint();
}
function setS(k,txt,pct,val,goodUp){var e=$('#s_'+k),lv=goodUp?(pct>=40?2:pct>=15?1:0):(pct<=25?2:pct<=60?1:0);var bb=e.querySelector('b');bb.className=['v-b','v-w','v-g'][lv];bb.textContent=txt+' · '+(goodUp?['부족','보통','좋음']:['높음','보통','낮음'])[lv];e.querySelector('i').style.width=Math.max(2,Math.min(100,pct))+'%';var p=prev[k];prev[k]=val;if(p!==undefined&&Math.abs(p-val)>1e-9){var up=val>p;e.classList.remove('fu','fd');void e.offsetWidth;e.classList.add(up===goodUp?'fu':'fd');}}
function shake(){if(calm())return;var g=$('#game');g.classList.remove('shake');void g.offsetWidth;g.classList.add('shake');setTimeout(function(){g.classList.remove('shake');},300);}
function paint(){
  if(!$("#vCog"))return;
  if(st.owned.length>seenOwned){var si=-1;prevPipe.forEach(function(id,i){if(id&&!(st.pipeline[i]&&st.pipeline[i].nodeId===id))si=i;});sfx('done');burst($$('#pipe .slot')[si]||$('#bEvo'));if($('#evoOv').classList.contains('show'))renderTree();}
  seenOwned=st.owned.length;
  if(st.ariaCount>seenAria){sfx('aria');shake();var tv=$('#vTr');tv.classList.remove('tflash');void tv.offsetWidth;tv.classList.add('tflash');}
  seenAria=st.ariaCount;
  var d=st.drug,dv=derive(st),am=amyAvg(st);
  var rv=String(Math.floor(st.rp));if($('#rp').textContent!==rv){$('#rp').textContent=rv;var rb=$('#rp');rb.classList.remove('pop');void rb.offsetWidth;rb.classList.add('pop');}
  $('#date').innerHTML='<b>'+(st.week/4.33).toFixed(1)+'개월</b> / 36개월';
  $('#vCog').textContent=Math.max(0,st.cognition).toFixed(0)+'%';$('#bCog').style.width=Math.max(0,st.cognition)+'%';
  $('#vTr').textContent=Math.max(0,st.trust).toFixed(0);$('#bTr').style.width=Math.max(0,Math.min(100,st.trust))+'%';
  $('#vAmy').textContent=am.toFixed(0)+' (목표 20 미만)';$('#bAmy').style.width=am+'%';
  $('#vRv').textContent=st.rival.toFixed(0)+'%'+(st.rivalWon?' 승인됨':'');$('#bRv').style.width=st.rival+'%';
  ['C','H','O','N'].forEach(function(a){$('#m'+a+' span').textContent=st.atoms[a];});
  setS('up',d.uptake.toFixed(d.uptake<1?2:1)+'%',Math.log10(d.uptake*10+1)/3*100,d.uptake,true);
  setS('th',(dv.theta*100).toFixed(0)+'%',dv.theta*100,dv.theta,true);
  setS('cl',(dv.clear*100).toFixed(2)+'%/주',dv.clear/.1*100,dv.clear,true);
  setS('ts',(dv.tauSpread/K.SPREAD_RATE).toFixed(2)+'배',dv.tauSpread/K.SPREAD_RATE*50,dv.tauSpread,false);
  setS('ar',(dv.aria*100).toFixed(1)+'%',dv.aria*100*4,dv.aria,false);
  var tr=trialReport(st),fc=trialForecast(st),th2='<b>시험 보고서</b> '+tr.ko+'<br><span class="dim">'+tr.tip+'</span><br><span class="'+(fc.pass?'good':'warn')+'">'+trialLine(fc)+'</span>';if($('#trial').dataset.h!==th2){$('#trial').dataset.h=th2;$('#trial').innerHTML=th2;}
  var tb=$('#bTrial');if(tb){var cd=Math.ceil((st.trialNext||0)-st.week);tb.innerHTML=cd>0?'시험<br>'+cd+'주':'임상<br>시험 '+trialCost(st);}
  $('#doseV').textContent=st.dose.toFixed(1);$('#dose').value=st.dose;
  $('#raw').innerHTML='분자량 '+(d.MW>1e4?(d.MW/1000).toFixed(0)+' kDa':d.MW.toFixed(0)+' Da')+(d.type==='ab'?' (항체)':' (소분자)')+' · Kd '+d.Kd.toFixed(2)+' · BBB점수 '+d.bbbScore.toFixed(2)+(d.type==='ab'?'':' · logP '+d.logP.toFixed(1)+' · HBD '+d.HBD+' · TPSA '+d.TPSA.toFixed(0));
  st.regions.forEach(function(r){var e=regEl[r.id],hot=r.tau>K.TAU_THRESHOLD;e.c.setAttribute('fill-opacity',(r.tau/100*.85).toFixed(2));
    e.c.setAttribute('stroke-opacity',hot?(.35+.55*Math.abs(Math.sin(st.week*.25))).toFixed(2):0);e.t.textContent=r.tau.toFixed(0);
    var n=Math.round(r.amy/100*7);if(n!==e.n){e.n=n;e.amy.innerHTML='';var s=e.sz;for(var i=0;i<n;i++){var a=i*2.399+r.xy[0],rad=s*(.35+.65*((i*37%10)/10));el('circle',{cx:r.xy[0]+Math.cos(a)*rad*.9,cy:r.xy[1]+Math.sin(a)*rad*.6,r:s<15?1.6:2.3,fill:'#ffb454','pointer-events':'none'},e.amy);}}});
  var key=st.bubbles.map(function(b){return b.id;}).join(',');
  if(key!==bubKey){bubKey=key;bubG.innerHTML='';st.bubbles.forEach(function(b){var g=el('g',{class:'bub'},bubG);el('circle',{cx:b.x,cy:b.y,r:26,fill:'#000','fill-opacity':0},g);el('circle',{cx:b.x,cy:b.y,r:13,fill:b.rv?'#3da5ff':'#3fe08a',stroke:b.rv?'#c4e4ff':'#b9ffd5','stroke-width':2},g);var t=el('text',{x:b.x,y:b.y+3.5,'text-anchor':'middle','font-size':8.5,'font-weight':900,fill:'#05301a','pointer-events':'none'},g);t.textContent=b.rv?'경쟁사':'논문';if(b.rv)t.setAttribute('font-size',7);g.onclick=function(){collectBubble(st,b.id);sfx('bubble');};});}
  var ph='';st.pipeline.forEach(function(p,i){ph+=p?'<div class="slot run" data-i="'+i+'">'+ico(p.nodeId,16)+' <b>'+EASY[p.nodeId][0]+'</b><div class="pb"><i></i></div><div class="sr"><span>'+CONDK[p.cond]+(p.mult<1?' <span class="w">수율 저하</span>':'')+'</span><button class="sc" data-c="'+i+'" aria-label="'+EASY[p.nodeId][0]+' 합성 취소">취소</button></div></div>':'<div class="slot empty">'+(i===0?'개발 버튼으로 시작':'빈 칸 '+(i+1))+'</div>';});
  if($('#pipe').dataset.h!==ph){$('#pipe').dataset.h=ph;$('#pipe').innerHTML=ph;}
  st.pipeline.forEach(function(p,i){if(p){var pe=$('#pipe [data-i="'+i+'"] .pb i');if(pe)pe.style.width=(p.progress*100).toFixed(0)+'%';}});
  prevPipe=st.pipeline.map(function(p){return p&&p.nodeId;});
  var nx0=nextRec(),sm=st.regions.filter(function(r){return r.id==='sm';})[0],hot=sm.tau>=25||st.cognition<60||st.trust<40||st.rival>=80;
  $('#danger').classList.toggle('on',hot&&!st.over);
  var g=$('#goal'),run=st.pipeline.filter(Boolean)[0],gt='';
  if(!st.owned.length&&!run&&nx0){var cc=nodeCost(st,nx0[0]).rp;gt='<b>지금 할 일</b> 왼쪽 아래 <b>개발</b> 버튼을 눌러 「'+EASY[nx0[0]][0]+'」부터 만드세요. 필요한 연구점수는 '+cc+'점이에요'+(st.rp>=cc?'.':' (지금 '+Math.floor(st.rp)+'점, 조금 모아야 해요).');}
  else if(run&&!nx0){gt='<b>지금 할 일</b> 합성이 끝나길 기다리세요.';}
  else if(nx0){var c2=nodeCost(st,nx0[0]).rp;gt=st.rp>=c2?'<b>지금 할 일</b> 연구점수가 '+Math.floor(st.rp)+'점이에요. 「'+EASY[nx0[0]][0]+'」부터 개발하세요 (필요 '+c2+'점).':'<b>지금 할 일</b> 연구점수를 모으는 중이에요. 「'+EASY[nx0[0]][0]+'」까지 '+Math.ceil(c2-st.rp)+'점 남았어요.';}
  else gt='<b>지금 할 일</b> 투여량을 조절하며 사건에 대비하세요.';
  if(run)gt+=' <span class="dim">합성 중: '+EASY[run.nodeId][0]+' (약 '+Math.ceil(run.total*(1-run.progress)/(st.speed*K.WEEKS_PER_SEC))+'초)</span>';
  gt+='<br><span class="dim">'+PROFILES[st.profile].ko+(st.waves&&st.waves.length?' +'+st.waves.length:'')+' · </span>'+(sm.tau>=25?'<span class="w">감각운동 타우 '+sm.tau.toFixed(0)+'/50</span>':'감각운동 타우 '+sm.tau.toFixed(0)+'/50')+'<span class="dim"> · 경쟁사 '+st.rival.toFixed(0)+'%</span>';
  g.innerHTML=gt;
  var nx=nx0,h=$('#hint');
  if(nx&&!h.dataset.off){$('#hintT').innerHTML='<b>추천</b> '+ico(nx[0],16)+' '+EASY[nx[0]][0]+'<br><span class="dim">'+nx[1]+'</span>';h.style.display='block';}else h.style.display='none';
  $('#bEvo').classList.toggle('pulse',!!nx);
  $('#news').textContent=clean(st.week===0?(st.paused?'오른쪽 아래 재생 버튼이나 스페이스바로 시작해요.':'시작! 타우가 번지기 전에 약을 개발하세요.'):(st.news[0]||''));var pk=st.paused?'play':'pause',bp=$('#bPause');if(bp.dataset.k!==pk){bp.dataset.k=pk;bp.innerHTML=gl(pk,20);bp.setAttribute('aria-label',st.paused?'계속하기':'멈추기');}
  bp.classList.toggle('pulse',st.paused&&st.week===0&&!tipBusy());
  $('#x4').style.display=st.combos.indexOf('X4')>=0&&!st.earlyUsed?'block':'none';
}
$('#pipe').onclick=function(e){var b=e.target.closest('.sc');if(!b||blocked())return;var i=+b.dataset.c;dlg('합성을 취소할까요?','합성을 취소하면 투입한 자원의 50%만 돌려받아요.',[['계속 만들기',null,1],['합성 취소하기',function(){cancel(st,i);renderTree();}]]);};

// ---------- 결과 화면 ----------
var BK='neuroinc.best',SK='neuroinc.seen';
function seenGet(){var x=null;try{x=JSON.parse(localStorage.getItem(SK)||'null');}catch(e){}x=x&&typeof x==='object'?x:{};x.played=x.played||{};x.won=x.won||{};return x;}
function seenMark(win){var x=seenGet();x.played[st.company]=1;if(win)x.won[st.diff]=1;try{localStorage.setItem(SK,JSON.stringify(x));}catch(e){}return x;}
// 다음 판 권유: 안 해 본 회사, 아직 못 이긴 난이도, 못 한 도전 하나 순서
function nextRun(sn,ach){var cs=Object.keys(COMPANIES).filter(function(k){return !sn.played[k];});
  if(cs.length)return '아직 안 해 본 회사 「'+COCO[cs[0]][1]+'」에 도전해 보세요. '+COCO[cs[0]][2];
  var ds=['normal','hard','easy'].filter(function(k){return !sn.won[k];});
  if(ds.length)return '아직 이기지 못한 난이도 「'+DIFF[ds[0]].ko+'」에 도전해 보세요.';
  var a=ach.filter(function(x){return !x.ok;})[0];return a?'도전 과제 「'+a.ko+'」에 도전해 보세요.':'';}
function monthsOf(l){return Math.max(1,Math.round(l.week/4.33));}
function decName(l){return l.kind==='chem'?(EASY[l.title.split(' ')[0]]||[l.title])[0]+' 합성':clean(l.title);}
function decList(){var b=st.log.filter(function(l){return !l.good;}),g=st.log.filter(function(l){return l.good;});return {bad:b,all:b.concat(g)};}
function resultText(){var o=st.over,d=decList(),n=Math.max(0,st.log.length-d.bad.length),L=['NEURO INC. 결과',
  o.win?'등급 '+o.grade+', 승리 ('+o.why+')':'패배, '+o.why,
  '환자군 '+PROFILES[st.profile].ko+', 난이도 '+DIFF[st.diff].ko+', 회사 '+COMPANIES[st.company].name+', 시나리오 '+SCN[st.scn].ko,
  '인지 '+Math.max(0,o.cognition).toFixed(0)+'%, 신뢰도 '+Math.max(0,o.trust).toFixed(0)+', 아밀로이드 '+o.amy.toFixed(0)+', 경쟁사 진행 '+Math.min(100,st.rival).toFixed(0)+'%',
  (st.trials?'임상 시험 '+st.trials+'번 중 '+(st.trialPassed||0)+'번 통과':'임상 시험 안 함')+', 좋은 선택 '+n+'개, 아쉬운 선택 '+d.bad.length+'개'];
  if(d.bad.length)L.push('아쉬웠던 선택: '+d.bad.slice(0,5).map(function(l){return decName(l)+'('+clean(l.pick)+')';}).join(', '));
  L.push('https://jaeho9158.github.io/neuro-inc/');return L.join('\n');}
function copyResult(btn){var tx=resultText(),old=btn.textContent;
  function fb(){dlg('결과 복사','아래 글을 모두 골라 복사해 주세요.',[['닫기']]);var ta=document.createElement('textarea');ta.id='dlgTa';ta.className='cp';ta.readOnly=true;ta.value=tx;$('#dlgB').parentNode.insertBefore(ta,$('#dlgBtns'));ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);}
  try{navigator.clipboard.writeText(tx).then(function(){btn.textContent='복사했어요';setTimeout(function(){btn.textContent=old;},2000);},fb);}catch(e){fb();}}
function rivalPill(o){var c,t;if(st.rivalWon){c=' rd';t='경쟁사가 먼저 승인';}else if(o.win){c=' bl';t='경쟁사보다 먼저 승인';}else{c='';t='경쟁사 진행 '+Math.min(100,Math.round(st.rival))+'%';}return '<span class="pill m'+c+'">'+t+'</span>';}
function gradeText(){var g=K.GRADE,x5=COMBOS.filter(function(c){return c.id==='X5';})[0].name;
  return '승리하려면 36개월을 채우고 인지 기능 '+g.WIN_COG+'% 이상, 아밀로이드 '+g.WIN_AMY+' 미만이어야 해요. S는 인지 기능 '+g.S_COG+'% 이상, 신뢰도 '+g.S_TRUST+' 이상에 「'+x5+'」 조합까지 만든 경우예요. A는 인지 기능 '+g.A_COG+'% 이상이에요. 그 밖의 승리는 B예요. 경쟁사가 먼저 승인받으면 최고 B예요.';}
function showEnd(){
  var o=st.over,best=null;if(o.shown)return;o.shown=1;try{best=JSON.parse(localStorage.getItem(BK)||'null');}catch(e){}
  var rank={S:4,A:3,B:2},sc=o.win?rank[o.grade]*1000+Math.round(o.cognition):0,nb=best&&best.sc>=sc?best:{sc:sc,grade:o.win?o.grade:'-',cog:Math.round(o.cognition)};
  if(sc>0&&(!best||sc>best.sc))try{localStorage.setItem(BK,JSON.stringify(nb));}catch(e){}
  var sn=seenMark(o.win),ach=achievements(st),done=ach.filter(function(x){return x.ok;}),left=ach.filter(function(x){return !x.ok;}),nr=nextRun(sn,ach),d=decList();
  var cards=d.all.map(function(l){var g=l.good;return '<div class="card dc '+(g?'g':'b')+'"><div class="rbtn sm">'+(g?'맞음':'아쉬움')+'</div><div><b>'+monthsOf(l)+'개월 · '+decName(l)+', '+clean(l.pick)+'</b><div>'+(g?'상황에 맞는 선택이었어요.':(l.best?'정답은 '+clean(l.best)+'. ':'')+clean(l.why))+'</div></div></div>';}).join('');
  var nk=o.win?advUnlock():null,second=o.win?(nk?'<div class="card adv"><b class="warn">'+ADVISORS[nk].ko+'</b>이 합류했어요. 다음 판 시작할 때 선임할 수 있어요 ('+ADVISORS[nk].d+').</div>':''):'<div class="card"><b class="warn">다음엔?</b> '+(st.profile==='advanced'?'이 환자들은 타우가 이미 퍼져 있어요. 항타우 약을 일찍 준비하세요.':st.profile==='apoe4'?'이 환자들은 부작용에 약해요. 유전자 검사와 낮은 투여량이 핵심이에요.':'이 환자들은 반응이 좋아요. 찌꺼기를 강하게 지우되 MRI는 꼭 두세요.')+'</div>';
  var cog=Math.max(0,o.cognition).toFixed(0)+'%';
  $('#endBox').innerHTML='<div class="top"><div class="gr'+(o.win?'':' l')+'" id="endGrade">'+(o.win?o.grade:gl('x',92))+'</div><div><div class="ttl">'+(o.win?'36개월 완주, 승리':'패배')+'</div>'+(o.win?'':'<div class="why">'+o.why+'</div>')+
   '<div class="sub">'+PROFILES[st.profile].ko+' · '+DIFF[st.diff].ko+' · '+COMPANIES[st.company].name+' · '+SCN[st.scn].ko+'</div>'+
   '<div class="prow"><span class="pill m on">인지 '+cog+'</span><span class="pill m">신뢰도 '+Math.max(0,o.trust).toFixed(0)+'</span><span class="pill m">아밀로이드 '+o.amy.toFixed(0)+'</span>'+rivalPill(o)+'</div></div></div>'+second+
   '<div class="prow"><span class="dim" style="font-size:14px">달성한 도전</span>'+(done.length?done.map(function(a){return '<span class="pill s on">'+a.ko+'</span>';}).join(''):'<span class="dim" style="font-size:14px">아직 없어요</span>')+'</div>'+
   (left.length?'<details><summary>남은 도전 '+left.length+'개</summary><div style="margin-top:6px">'+left.map(function(a){return a.ko;}).join(' · ')+'</div></details>':'')+'<details><summary>등급 기준</summary><div style="margin-top:6px">'+gradeText()+'</div></details>'+(nr?'<div class="rule"><b>다음 판은?</b> '+nr+'</div>':'')+
   '<h3>결정 기록 · 정답과 비교</h3><div class="list">'+(cards||'<div class="rule">이번 판에는 결정 기록이 없어요.</div>')+'</div>'+
   '<div class="ft"><div class="note">모든 수치는 교육용 단순화값이에요. 사건 카드는 실제 사례에서 영감을 받은 가상 이야기예요.<br>'+(nb.grade==='-'?'최고 기록 아직 없음':'최고 기록 '+nb.grade+' (인지 '+nb.cog+'%)')+'</div><button class="btn gh" id="endCopy">결과 복사</button><button class="btn gh" id="endHome">처음 화면으로</button><button class="btn big" id="endAgain">같은 조건으로 다시</button></div>';
  $('#endCopy').onclick=function(){copyResult(this);};$('#endHome').onclick=goHome;$('#endAgain').onclick=again;
  if($('#coach').style.display==='block')coach(-1);tipHide();
  $('#end').classList.add('show');sfx(o.win?'win':'lose');if(o.win)burst($('#endGrade'));
}
// ---------- 한 번만 보이는 안내 (실험실, 임상 시험). 튜토리얼이나 창이 열려 있으면 숨고, 게임은 멈추지 않아요 ----------
var TIPS={tipLab:{h:'실험실',t:'#bLab',b:'실험실은 연구점수로 주문한 원료를 화합물로 만들어요. 그 화합물을 작용기로 약에 붙이면 약의 성능이 달라져요.',
   ok:function(){return st.week>4&&st.owned.length>=1&&st.rp>=orderCost(st);}},
 tipTrial:{h:'임상 시험',t:'#bTrial',b:'임상 시험은 지난 시험보다 눈에 띄게 나아졌을 때 통과하고, '+K.TRIAL_CD+'주에 한 번만 할 수 있어요. 통과하면 신뢰도와 연구점수를 받지만 경쟁사 속도도 '+rivPc()+'% 늘어요.',
   ok:function(){return st.owned.length>=1&&st.week>=(st.trialNext||0)&&st.rp>=trialCost(st)&&trialForecast(st).pass;}}},tipCur=null;
function tipSeen(k){try{return localStorage.getItem('neuroinc.'+k)==='1';}catch(e){return false;}}
function tipDone(k){try{localStorage.setItem('neuroinc.'+k,'1');}catch(e){}}
function tipBusy(){return $$('.ov.show').length>0||$('#coach').style.display==='block';}
function tipHide(){var t=$('#tip');t.style.display='none';$$('#bLab.hl,#bTrial.hl').forEach(function(e){e.classList.remove('hl');});}
function tipCheck(){
  if(!st||st.over)return;var t=$('#tip');
  if(tipCur){if(tipBusy())tipHide();else if(t.style.display!=='block'){t.style.display='block';$(TIPS[tipCur].t).classList.add('hl');}return;}
  if(tipBusy())return;
  Object.keys(TIPS).some(function(k){if(tipSeen(k)||!TIPS[k].ok())return false;tipCur=k;
    t.innerHTML='<b>'+TIPS[k].h+'</b><p>'+TIPS[k].b+'</p><div class="nav"><button class="btn" id="tipOk">알겠어요</button></div>';
    $('#tipOk').onclick=function(){tipDone(k);tipCur=null;tipHide();};
    t.style.display='block';$(TIPS[k].t).classList.add('hl');return true;});
}
var lastOwned=0;
function frame(t){
  if(st&&!st.over){var dt=Math.min(.25,(t-last)/1000);if(halted())acc=0;else acc+=dt;
    while(acc>=.1&&!halted()){acc-=.1;if(!st.paused&&!st.event){step(st,.1*st.speed*K.WEEKS_PER_SEC);
      if(st.lastCombo){var c=st.lastCombo;st.lastCombo=null;
        if(c.warn){sfx('alert');dlg('소분자로 바뀌었어요','뇌 장벽은 쉬워지지만 질병을 늦추는 힘(제거 속도)이 절반으로 줄었어요. 도네페질 같은 소분자 약이 증상은 완화해도 병의 진행은 못 막는 것과 같은 구도예요.',[['알겠어요']]);}
        var b=$('#banner');b.textContent='조합 보너스 해금 · '+c.name;b.style.display='block';clearTimeout(bannerT);bannerT=setTimeout(function(){b.style.display='none';},3000);}
      }}
    if(st.event&&!evOpen)showEvent();
    paint();tipCheck();if($('#evoOv').classList.contains('show')&&Math.floor(t/500)!==lastOwned){lastOwned=Math.floor(t/500);renderTree();}
    if(st.over)showEnd();
  }
  last=t;requestAnimationFrame(frame);
}
requestAnimationFrame(function(t){last=t;frame(t);});
window.__dbg={get st(){return st;},simulate:simulate,get sfxLog(){return SFXLOG.slice();},get ac(){return AC;},get sfxVia(){return SFXVIA.slice();},sbuf:SBUF,
  render:function(n){return new Promise(function(ok,no){var OC=window.OfflineAudioContext||window.webkitOfflineAudioContext,c=new OC(1,88200,44100),p=play(c,n,0);c.startRendering().then(function(buf){var x=buf.getChannelData(0),pk=0,a=0,b,i,sq=0;for(i=0;i<x.length;i++)if(Math.abs(x[i])>pk)pk=Math.abs(x[i]);
    if(!pk)return ok({path:p,lead:0,dur:0,peak:-99,rms:-99});while(Math.abs(x[a])<pk*.01)a++;b=x.length-1;while(Math.abs(x[b])<pk*.01)b--;for(i=a;i<=b;i++)sq+=x[i]*x[i];
    ok({path:p,lead:Math.round(a/441*10),dur:+((b+1)/44100).toFixed(3),peak:+(20*Math.log10(pk)).toFixed(1),rms:+(10*Math.log10(sq/(b-a+1))).toFixed(1)});},no);});},
  advance:function(w){var end=st.week+w,dt=.1*K.WEEKS_PER_SEC;while(st.week<end&&!st.event&&!st.over)step(st,Math.min(dt,end-st.week));return st.week;},
  paint:function(){if(st.event&&!evOpen)showEvent();paint();tipCheck();if(st.over)showEnd();}};
function fit(){var s=Math.min(innerWidth/1440,innerHeight/900);$('#stage').style.transform='translate('+((innerWidth-1440*s)/2)+'px,'+((innerHeight-900*s)/2)+'px) scale('+s+')';
  if(s<.6&&!smallShown&&!PORT.matches){smallShown=true;$('#small').classList.add('show');$('#smallBtn').focus();}} // 배율이 0.6보다 작으면 한 번만, 세로 안내가 떠 있을 때는 안 띄워요
$('#smallBtn').onclick=function(){$('#small').classList.remove('show');};
addEventListener('resize',fit);fit();
})();
