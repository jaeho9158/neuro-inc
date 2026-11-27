// node balance.test.js [_engine.js]: 엔진만 읽어 렌더링 없이 밸런싱 검증
const fs = require('fs'), path = require('path');
const code = fs.readFileSync(process.argv[2] || path.join(__dirname, '_engine.js'), 'utf8');
const E = new Function(code + '; return {runTrial,trialEval,trialReport,K,LAB,labCraft,labAttach,labOrder,orderCost,NODE,computeDrug,simulate,newState,buy,step,canBuy,condMult,COMPANIES,PROFILES,EVENTS,resolveEvent,SCN,phaseOf,achievements,nodeCost,ADVISORS,applyAdvisor,collectBubble,trialForecast,trialBlock};')();
let fails = 0;
const ok = (name, cond, info) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!cond) fails++; };
const seeds = [1, 2, 3, 4, 5, 6];
const run = S => seeds.map(s => E.simulate(S, s));
const wins = rs => rs.filter(o => o.win).length;
const mean = (rs, k) => rs.reduce((a, o) => a + o[k], 0) / rs.length;

// 수식 3값
const D = E.computeDrug; E.COMPANIES.__t = { base: 'ab', mods: { add: {}, mul: {} } };
const ab = D('__t', [], []), ab6 = D('__t', ['A1', 'A3', 'C1', 'C3', 'A6'], []);
ok('lecanemab bbbScore ≈ -6.7', Math.abs(ab.bbbScore + 6.7) < .1, ab.bbbScore.toFixed(2));
ok('+shuttle bbbScore ≈ -2.2, uptake ≈ 9.1%', Math.abs(ab6.bbbScore + 2.2) < .1 && Math.abs(ab6.uptake - 9.1) < .4);
E.COMPANIES.__s = { base: 'sm', mods: { add: {}, mul: {} } };
const sm = D('__s', [], []);
ok('donepezil bbbScore ≈ +8.0', Math.abs(sm.bbbScore - 8) < .1);

const P = {
  early: ['C1', 'B2', 'B3', 'C4', 'A1', 'A3', 'C3', 'A6', 'C5', 'C6'],
  apoe4: ['C1', 'C2', 'C4', 'A1', 'A3', 'C3', 'A6', 'B1', 'B3', 'C5', 'C6'],
  adv: ['C1', 'A1', 'A3', 'C3', 'A6', 'B1', 'B3', 'C4', 'B7', 'C6'],
};
// 1) 업그레이드 없이는 어느 코호트든 진다
for (const pr of ['early', 'apoe4', 'advanced'])
  ok('무투자 패배 · ' + pr, wins(run({ order: [], profile: pr, dose: () => 5 })) === 0);
// 2) 같은 전략이 코호트에 따라 성패가 갈린다 (비선형)
ok('진행기 코호트: 초기용 경로는 전멸', wins(run({ order: P.early, profile: 'advanced', dose: () => 5 })) === 0);
ok('진행기 코호트: 항타우 경로(B7)는 이긴다', wins(run({ order: P.adv, profile: 'advanced', dose: () => 5 })) >= 5);
ok('초기 코호트: 초기용 경로 승리', wins(run({ order: P.early, profile: 'early', dose: () => 5 })) >= 5);
// 3) 같은 투여량이 코호트에 따라 정답이 바뀐다
const lowE = wins(run({ order: P.early, profile: 'early', dose: () => 3 })), lowA = wins(run({ order: P.apoe4, profile: 'apoe4', dose: () => 3 }));
ok('낮은 용량: 초기 코호트는 충분, APOE4 코호트는 부족', lowE >= 5 && lowA <= 2, `early ${lowE}/6 · apoe4 ${lowA}/6`);
// 4) 합성 조건: 같은 노드도 약물 종류·장비 상태로 정답이 바뀐다
const n = E.NODE.B4;                       // 흡열(ΔH>0)
const stAb = E.newState('antibody_house', 1, 'normal', 'early');
ok('항체+흡열: 냉각이 가열보다 빠름(단백질 변성)', E.condMult(stAb, n, 'cool') > E.condMult(stAb, n, 'heat'));
const stSm = E.newState('small_lab', 1, 'normal', 'early');
ok('소분자+흡열: 가열이 냉각보다 빠름(르샤틀리에)', E.condMult(stSm, E.NODE.A3, 'heat') > E.condMult(stSm, E.NODE.A3, 'cool'));
const stBusy = E.newState('small_lab', 1, 'normal', 'early'); stBusy.pipeline = [{ cond: 'heat' }, { cond: 'heat' }, null];
ok('가열기 포화: 정답이 촉매로 바뀜', E.condMult(stBusy, E.NODE.A3, 'catalyst') > E.condMult(stBusy, E.NODE.A3, 'heat'));
const rw = run({ order: P.adv, profile: 'advanced', cond: 'wrong', dose: () => 5 });
ok('틀린 합성 조건만 쓰면 이길 확률이 떨어짐', wins(rw) < wins(run({ order: P.adv, profile: 'advanced', dose: () => 5 })), `${wins(rw)}/6`);
// 5) 이벤트 정답 vs 오답
const evB = run({ order: P.adv, profile: 'apoe4', dose: () => 5 }), evW = run({ order: P.adv, profile: 'apoe4', dose: () => 5, event: 'wrong' });
ok('이벤트 오답은 신뢰도를 깎음', mean(evB, 'trust') > mean(evW, 'trust') + 3, `${mean(evB, 'trust').toFixed(0)} vs ${mean(evW, 'trust').toFixed(0)}`);
// 6) 경쟁사: 어려움에서는 대개 먼저 승인, 쉬움에서는 못 함
const rate = d => seeds.map(s => E.newState('antibody_house', s, d, 'early').rivalRate * E.K.TOTAL_WEEKS);
ok('경쟁사: 어려움은 156주 안에 승인 / 쉬움은 못 함', rate('hard').every(x => x >= 100) && rate('easy').every(x => x < 100) && rate('normal').every(x => x >= 100 && x < 160));
// 7) 합성 실험실
{const s=E.newState('small_lab',1,'normal','early');s.atoms={C:9,H:9,O:9,N:9};
 ok('원료 부족하면 합성 실패', (()=>{const z=E.newState('small_lab',1,'normal','early');z.atoms={C:0,H:0,O:0,N:0};return E.labCraft(z,'ethanol')==='재료 부족';})());
 ok('에탄올 합성: 원료 소모 + 재고 +1', E.labCraft(s,'ethanol')===true&&s.lab.ethanol===1&&s.atoms.C===7&&s.atoms.H===3);
 const kd0=s.drug.Kd;E.labCraft(s,'ammonia');E.labAttach(s,'ammonia');
 ok('작용기를 붙이면 약의 Kd가 바뀜', s.drug.Kd<kd0&&s.groups.length===1);
 s.rp=99;s.lab.acetic=0;
 ok('촉매는 아세트산이 있어야 가능', typeof E.buy(s,'A3','catalyst')==='string');
 const sa=E.newState('antibody_house',1,'normal','early'),ss=E.newState('small_lab',1,'normal','early');
 [sa,ss].forEach(x=>{x.rp=99;x.lab.ethanol=1;x.owned=['A1'];});
 E.buy(sa,'A3','cool',true);E.buy(ss,'A3','heat',true);
 ok('에탄올 용매: 항체는 느려지고 소분자는 빨라짐', sa.pipeline[0].mult<1&&ss.pipeline[0].mult>1,sa.pipeline[0].mult.toFixed(2)+' / '+ss.pipeline[0].mult.toFixed(2));}
{const z=E.newState('small_lab',1,'normal','early');z.rp=100;const c0=E.orderCost(z);E.labOrder(z,'C');ok('시약 주문은 RP를 쓰고 갈수록 비싸짐',z.rp<100&&E.orderCost(z)>c0&&z.atoms.C===9);ok('CHON은 자동으로 쌓이지 않음',(()=>{const s=E.newState('small_lab',1,'normal','early'),a=JSON.stringify(s.atoms);for(let i=0;i<300;i++)E.step(s,.1);return a===JSON.stringify(s.atoms);})());}
{const a=E.newState('small_lab',1,'normal','early','std'),f=E.newState('small_lab',1,'normal','early','fast'),t=E.newState('small_lab',1,'normal','early','tight');
 ok('패스트 트랙은 비용 할인과 부작용 증가',E.nodeCost(f,'A1').rp<E.nodeCost(a,'A1').rp&&f.ariaPerm>a.ariaPerm);
 ok('자금난은 연구점수 수급 감소, 경쟁사 지연',t.rpPerm<a.rpPerm&&t.rivalRate<a.rivalRate);
 const s=E.newState('small_lab',1,'normal','early');const p0=s.ph;s.regions.forEach((r,i)=>{if(i<3)r.tau=30;});E.step(s,.1);
 ok('타우 확산 단계가 오르면 뉴스가 나옴',s.ph>p0&&s.news.length>0,'단계 '+s.ph);
 const w=E.newState('small_lab',1,'normal','early');w.over={win:true};w.groups=['a','b','c'];w.rp=120;
 ok('업적: 부작용 없이 완주 등',E.achievements(w).slice(0,4).every(x=>x.ok));
 const v=E.newState('small_lab',3,'normal','early');v.week=27;E.step(v,.1);
 ok('26주에 새 환자군이 합류',v.waves.length===1&&v.news[0].includes('합류'),v.news[0]);}
{
 const a=E.newState('antibody_house',2,'normal','early');let sec=0;const need=E.nodeCost?0:0;
 while(a.rp<8&&sec<30){E.step(a,.1);sec+=.1;}
 ok('첫 구매(8점)를 5초 안에 할 수 있음(1배속)',sec<=5,sec.toFixed(1)+'초');
 const b=E.newState('small_lab',2,'normal','early');b.atoms={C:9,H:20,O:9,N:3};const r0=b.rp;E.labCraft(b,'ethanol');const r1=b.rp;E.labCraft(b,'ethanol');
 ok('처음 합성하면 도감 보너스, 두 번째는 없음',r1-r0===E.K.DISC_RP&&b.rp===r1);
 {const mk=(ans)=>{const s=E.newState('small_lab',2,'normal','early');s.atoms={C:9,H:20,O:9,N:3};const a=s.rp;E.labCraft(s,'ethanol',ans);const b1=s.rp;E.labCraft(s,'ethanol',ans);return [b1-a,s.rp-b1];};
  const ok1=mk(true),ng=mk(false);ok('이름 맞히면 보너스 6, 두 번째는 0',ok1[0]===6&&ok1[1]===0,ok1.join());ok('이름 틀리면 보너스 2, 두 번째는 0',ng[0]===2&&ng[1]===0&&E.K.DISC_RP_MISS===2,ng.join());}
 const c=E.newState('small_lab',2,'normal','early');const kd0=c.drug.Kd;
 const dE=E.computeDrug('small_lab',[],[],['ethanol']),dA=E.computeDrug('small_lab',[],[],['acetic']),dEA=E.computeDrug('small_lab',[],[],['ethanol','acetic']);
 ok('수산기+카복실기 조합이 각각의 곱보다 붙는 힘이 더 강함(에스터 결합)',dEA.Kd<dE.Kd*dA.Kd/ E.computeDrug('small_lab',[],[],[]).Kd-1e-9,dEA.Kd.toFixed(3)+' vs '+(dE.Kd*dA.Kd/c.drug.Kd).toFixed(3));
 const tr=E.trialReport(c);ok('시험 보고서가 병목과 다음 행동을 알려 줌',!!tr.ko&&!!tr.tip,tr.ko);
}
{
 const s=E.newState('antibody_house',4,'normal','early');s.rp=200;s.owned=['C1'];s.drug=E.computeDrug('antibody_house',s.owned,[],[]); // MRI 노드는 병목(뇌 장벽 통과율)을 풀지 않는다
 const r1=E.runTrial(s);ok('개선 없이 첫 시험을 하면 미통과 + 이유',r1.ok&&!r1.rep.pass&&!!r1.rep.tip,r1.rep.ko);
 const r2=E.runTrial(s);ok('시험 직후엔 쿨다운',!r2.ok);
 s.week=s.trialNext+1;s.owned=['B3'];s.drug=E.computeDrug('antibody_house',s.owned,[],[]);
 const sc=E.trialEval(s).score;const r3=E.runTrial(s);ok('약을 개선하고 다시 시험하면 통과(점수 '+sc.toFixed(2)+')',r3.ok&&(r3.rep.pass===true),'gain '+r3.rep.gain.toFixed(2)+' pass '+r3.rep.pass);
 const p=E.newState('antibody_house',4,'normal','early');p.rp=0;p.owned=['C1'];const pr=E.runTrial(p);ok('연구점수가 모자라면 시험 불가',!pr.ok&&pr.msg.includes('연구점수'),pr.msg);
 {const g=E.newState('antibody_house',4,'normal','early');g.rp=200;const rp0=g.rp,r=E.runTrial(g);
  ok('B6 개발한 것이 없으면 시험 불가 + 이유, 상태는 그대로',!r.ok&&r.msg.includes('개발')&&g.rp===rp0&&!g.trials&&!g.trialNext,r.msg);
  g.groups=['ethanol'];ok('B6 작용기만 붙여도 시험 가능',E.runTrial(g).ok===true);
  const h=E.newState('antibody_house',4,'normal','early');h.rp=200;h.owned=['C1'];ok('B6 노드를 하나 개발하면 시험 가능',E.runTrial(h).ok===true);}
}
{const a=E.newState(Object.keys(E.COMPANIES)[0],3,'normal','early'),b=E.newState(Object.keys(E.COMPANIES)[0],3,'normal','early');ok('자문위원 선임: 부작용 15% 감소',E.applyAdvisor(b,'safety')&&Math.abs(b.ariaPerm/a.ariaPerm-.85)<1e-9);ok('자문위원은 한 명만',!E.applyAdvisor(b,'fund'));}
{const s=E.newState(Object.keys(E.COMPANIES)[0],4,'normal','early');s.rp=999;s.owned=['C1'];s.drug=E.computeDrug(s.company,s.owned,s.combos,s.groups);E.runTrial(s);s.week=s.trialNext;s.owned=['B3'];s.drug=E.computeDrug(s.company,s.owned,s.combos,s.groups);const r=E.runTrial(s);ok('실패 뒤 통과하면 재설계 업적',r.rep.pass?!!s.redesign:true,'pass='+r.rep.pass);const ev=E.EVENTS.filter(e=>e.id==='congress')[0];ok('통과 뒤 학회 사건 조건',ev.ok(s)===!!r.rep.pass);}
{const s=E.newState(Object.keys(E.COMPANIES)[0],5,'normal','early');s.rival=40;s.bubbles=[{id:99,x:0,y:0,ttl:9,rv:true}];const rp=s.rp;E.collectBubble(s,99);ok('경쟁사 거품은 경쟁사 진행을 줄임',s.rival===37&&s.rp===rp);const s2=E.newState(Object.keys(E.COMPANIES)[0],5,'normal','early');s2.rp=999;s2.owned=['B3'];s2.drug=E.computeDrug(s2.company,s2.owned,s2.combos,s2.groups);const r0=s2.rivalRate;const r=E.runTrial(s2);ok('시험 통과 시 경쟁사 가속',!r.rep.pass||Math.abs(s2.rivalRate/r0-E.K.TRIAL_RIVAL)<1e-9,'pass='+r.rep.pass);}

// ===== 검수 1 반영 (R1~R7) =====
{ // R1: 경쟁사 거품
 const seen=new Map(),s=E.newState('antibody_house',3,'normal','early');
 while(!s.over){if(s.event){E.resolveEvent(s,s.event.best);continue;}E.step(s,.1);s.bubbles.forEach(b=>{if(!seen.has(b.id)){seen.set(b.id,{rv:b.rv,rival:s.rival,week:s.week,ttl:b.ttl});}});if(s.week>=155)break;}
 const all=[...seen.values()],rvs=all.filter(b=>b.rv);
 ok('R1 보통 난이도, 아무것도 안 사고 156주: 경쟁사 거품이 1개 이상',rvs.length>=1,rvs.length+'개');
 ok('R1 경쟁사 20% 전에는 거품이 안 생김',rvs.every(b=>b.rival>=20));
 ok('R1 연구점수 거품은 0개(K.BUBBLES 꺼짐)',all.length===rvs.length&&E.K.BUBBLES===false);
 ok('R1 경쟁사 거품 수명은 6주',E.K.RIVAL_BUB_TTL===6&&rvs.every(b=>b.ttl===6));
 const t=E.newState('antibody_house',3,'normal','early');t.rival=30;t.bubbleT=0;t.rand=()=>0; // 확률 0이면 항상 경쟁사 거품
 E.step(t,.1);ok('R1 거품이 생길 때 뉴스 한 줄',t.bubbles.length===1&&t.bubbles[0].rv&&t.news.some(x=>x.includes('경쟁사 소식')&&x.includes('파란 거품')&&x.includes('3%')),t.news.filter(x=>x.includes('경쟁사 소식'))[0]);
 const id=t.bubbles[0].id;let w=0;t.rand=()=>.99; // 이후 새 거품이 안 생기게
 while(w<5.8){E.step(t,.1);w+=.1;}ok('R1 수명 안에는 남아 있음',t.bubbles.some(b=>b.id===id));
 while(w<6.5){E.step(t,.1);w+=.1;}ok('R1 수명이 지나면 사라짐',!t.bubbles.some(b=>b.id===id));
 const u=E.newState('antibody_house',3,'normal','early');u.rival=10;u.bubbleT=0;u.rand=()=>0;E.step(u,.1);ok('R1 경쟁사 20% 미만이면 안 생김',u.bubbles.length===0);
 const v=E.newState('antibody_house',3,'normal','early');v.rival=100;v.rivalWon=true;v.bubbleT=0;v.rand=()=>0;E.step(v,.1);ok('R1 이미 승인 뒤에는 안 생김',v.bubbles.length===0);
}
{ // R2: 연속 실패는 실제 연속일 때만
 const s=E.newState('antibody_house',4,'normal','early');s.rp=999;s.owned=['C1'];s.drug=E.computeDrug(s.company,s.owned,s.combos,s.groups);
 const ev=E.EVENTS.filter(e=>e.id==='trial_press')[0];
 ok('R2 처음에는 failStreak 0',s.failStreak===0);
 E.runTrial(s);ok('R2 한 번 실패하면 사건 조건 아님',s.failStreak===1&&!ev.ok(s));
 s.week=s.trialNext;s.owned=['C1','C2'];s.drug=E.computeDrug(s.company,s.owned,s.combos,s.groups);E.runTrial(s);ok('R2 연달아 두 번 실패하면 사건 조건',s.failStreak===2&&ev.ok(s),'streak '+s.failStreak);
 s.week=s.trialNext;s.owned=['B3'];s.drug=E.computeDrug(s.company,s.owned,s.combos,s.groups);const r=E.runTrial(s);
 ok('R2 통과하면 failStreak 0, 사건 조건 아님',r.rep.pass&&s.failStreak===0&&!ev.ok(s),'pass '+r.rep.pass);
 s.week=s.trialNext;E.runTrial(s);
 ok('R2 통과 뒤 실패 한 번이면 아님(누적 실패 '+s.trialFails+')',s.failStreak===1&&s.trialFails>=3&&!ev.ok(s));
}
{ // R3: 점수가 높아도 나아진 게 없으면 통과가 아님
 const g=E.newState('antibody_house',4,'normal','early');g.drug.uptake=90;g.drug.Kd=.0001;g.drug.retention=1;g.drug.clear=1.4;g.dose=5;const hi=E.trialEval(g).score;g.lastScore=hi;
 ok('R3 점수 '+hi.toFixed(2)+' 이고 지난 점수와 같으면(gain 0) 미통과',hi>=.6&&E.trialForecast(g).gain===0&&!E.trialForecast(g).pass);
 g.lastScore=hi*.9;ok('R3 점수가 높고 조금이라도 나아졌으면 통과',E.trialForecast(g).pass);
 g.lastScore=hi*1.1;ok('R3 점수가 높아도 지난 점수보다 낮으면 미통과',!E.trialForecast(g).pass);
}
{ // R4: 예상과 실제 결과가 같음
 let n=0,bad=0,pas=0;
 for(const co of Object.keys(E.COMPANIES))for(const pr of ['early','apoe4','advanced'])for(const owned of [[],['C1'],['B3'],['A1','A3'],['B2','B3'],['A1','A3','C1','C3'],['B2','B3','C1'],['A1','A3','C1','C3','A6']])for(const last of [null,.05,.3,.7]){
  const s=E.newState(co,5,'normal',pr);s.rp=999;s.owned=owned.slice();s.groups=owned.length?[]:['ethanol'];s.drug=E.computeDrug(co,s.owned,s.combos,s.groups);if(last!==null){s.lastScore=last;s.trials=1;}
  const f=E.trialForecast(s),r=E.runTrial(s);n++;if(!r.ok||r.rep.pass!==f.pass||r.rep.gain!==f.gain||r.rep.first!==f.first)bad++;if(f.pass)pas++;}
 ok('R4 여러 상태에서 예상과 실제 판정이 같음',bad===0&&pas>0&&pas<n,n+'건 중 통과 '+pas+', 불일치 '+bad);
 const z=E.newState('antibody_house',5,'normal','early');z.rp=99;z.owned=['C1'];const f0=E.trialForecast(z);E.runTrial(z);
 ok('R4 첫 시험 전에는 first=true, 한 번 하면 false',f0.first===true&&E.trialForecast(z).first===false&&f0.need===E.K.TRIAL_NEED);
}
{ // R5
 const s=E.newState('antibody_house',4,'normal','early');s.ariaPerm=50;const r=E.trialReport(s);
 ok('R5 부작용 쪽 조언은 MRI가 아니라 투여량과 천천히 늘려 투여',r.key==='ar'&&r.tip.includes('천천히 늘려 투여')&&!r.tip.includes('MRI'),r.tip);
}
{ // R6: 쿨다운 끝나기 1주 전은 거절
 const s=E.newState('antibody_house',4,'normal','early');s.rp=999;s.owned=['C1'];E.runTrial(s);
 s.week=s.trialNext-1;const a=E.runTrial(s);ok('R6 쿨다운 끝나기 1주 전 재시험은 거절',!a.ok&&a.msg.includes('1주'),a.msg);
 s.week=s.trialNext;ok('R6 쿨다운이 끝나면 가능',E.runTrial(s).ok===true);
}
{ // R7: 같은 환자군으로 다시
 const a=E.newState('antibody_house',77,'normal'),b=E.newState('antibody_house',9,'normal',a.profile);
 ok('R7 지난 판의 환자군을 주면 같은 환자군',b.profile===a.profile&&['early','apoe4','advanced'].every(p=>E.newState('antibody_house',1,'hard',p).profile===p));
}

/* 임상 시험 튜닝 기록 (B4). 각 칸: 안함/영리하게/무조건 승률 %, 영리하게 통과율. 3 코호트 x 40 시드.
   튜닝 전 (TRIAL_NEED .25, 보상 2배, 가속 1.04, 쿨다운 10주):
     easy   100 / 99 / 98   통과 43%
     normal  98 / 93 / 86   통과 43%   <- 영리하게가 안 함보다 5.8%p 낮아 B2 실패
     hard    70 / 67 / 63   통과 42%
   시험한 것 (normal 영리하게 승률): NEED .3~.7 은 변화 없음 또는 악화, 보상 1~3배와 가속 1.0~1.04 는 변화 없음.
   (시험이 추가 사건(학회, 언론 압박)을 끌어들여 무작위 사건 순서를 바꾸는 효과가 커서 이 둘은 영향이 없었다.)
   쿨다운만 효과가 있었다: 10~22주는 normal 이 -5pp 근처에 머물렀고, 28주부터 모든 시드 묶음(1, 101, 201, 301 시작)에서 통과.
   튜닝 후 (쿨다운 28주, 나머지 그대로; K.TRIAL_REWARD=2, K.TRIAL_RIVAL 은 상수로만 분리(처음 1.04, 출시 전 측정에서 시험하는 플레이어의 A 이상 확률이 약 14%p 내려가 1.02 로 낮춤)):
     easy   100 / 100 / 100  통과 58%
     normal  98 / 95 / 95   통과 58%
     hard    70 / 82 / 83   통과 59%
   기존 테스트의 "s.week+=11" 은 쿨다운 10주를 가정해서 "s.week=s.trialNext+1" 로 바꿨다. */
// ===== B1~B3: 임상 시험 정책 측정 (안 함 / 영리하게 / 무조건) =====
{
 const t0=Date.now(),SEEDS=Array.from({length:40},(_,i)=>i+1),POL=['none','smart','spam'],M={};
 const combos=[['early',P.early],['apoe4',P.apoe4],['advanced',P.adv]];
 console.log('\n난이도  정책   승률  통과율  시험수입비율(순)  번금액비율(보상+위로금)');
 for(const d of ['easy','normal','hard'])for(const pol of POL){
  const rs=[];for(const [pr,order] of combos)for(const s of SEEDS)rs.push(E.simulate({order,profile:pr,diff:d,trial:pol,dose:()=>5},s));
  const n=rs.length,sum=k=>rs.reduce((a,o)=>a+(o[k]||0),0),tn=sum('trials');
  const m=M[d+pol]={win:wins(rs)/n,pass:tn?sum('trialPass')/tn:0,share:sum('trialNet')/(sum('income')+sum('trialNet')),earn:sum('trialEarn')/(sum('income')+sum('trialEarn')),trials:tn/n};
  console.log(d.padEnd(7)+pol.padEnd(6)+(m.win*100).toFixed(0).padStart(4)+'%'+(pol==='none'?'     -':(m.pass*100).toFixed(0).padStart(5)+'%')+(pol==='none'?'       -':(m.share*100).toFixed(1).padStart(8)+'%')+(pol==='none'?'              -':(m.earn*100).toFixed(1).padStart(14)+'%')+'   (시험 '+m.trials.toFixed(1)+'회/판)');
 }
 for(const d of ['easy','normal','hard']){const a=M[d+'none'],b=M[d+'smart'],c=M[d+'spam'];
  ok('B2 '+d+': 영리한 시험 승률이 안 함보다 5%p 넘게 낮지 않음',b.win>=a.win-.05,(b.win*100).toFixed(0)+' vs '+(a.win*100).toFixed(0));
  ok('B2 '+d+': 영리한 시험 통과율 30~80%',b.pass>=.3&&b.pass<=.8,(b.pass*100).toFixed(0)+'%');
  ok('B3 '+d+': 무조건 시험 승률이 영리한 쪽보다 2%p 넘게 높지 않음',c.win<=b.win+.02,(c.win*100).toFixed(0)+' vs '+(b.win*100).toFixed(0));
  ok('B3 '+d+': 시험 수입 비율 35% 이하(영리/무조건)',b.share<=.35&&c.share<=.35,(b.share*100).toFixed(1)+'% / '+(c.share*100).toFixed(1)+'%');
  ok('B3 '+d+': 시험으로 번 금액(보상과 위로금, 시험 비용은 안 뺌) 비율 35% 이하(영리/무조건)',b.earn<=.35&&c.earn<=.35,(b.earn*100).toFixed(1)+'% / '+(c.earn*100).toFixed(1)+'%');}
 console.log('측정 시간 '+((Date.now()-t0)/1000).toFixed(1)+'초');
}
// P6 (검수 2)
{const ev=E.EVENTS.filter(e=>e.id==='aria_case')[0];
 const mk=(mri,prof)=>{const z=E.newState('antibody_house',1,'normal',prof||'early');z.drug.flags.mri=mri?1:0;z.dose=6;z.trust=50;return z;};
 const a=mk(true),b=mk(false),c=mk(true,'apoe4');
 ok('S1 정답 조건: MRI가 있으면 둘째, 없거나 APOE4 미선별이면 첫째',ev.best(a)===1&&ev.best(b)===0&&ev.best(c)===0,[ev.best(a),ev.best(b),ev.best(c)].join());
 const d0=a.dose;a.event={id:'aria_case',best:1};E.resolveEvent(a,1);
 ok('S1 둘째 선택은 투여량을 바꾸지 않고 신뢰도 +2(정답이라 연구점수 +10)',a.dose===d0&&a.trust===52,a.dose+' / '+a.trust);
 const f=mk(true);f.event={id:'aria_case',best:1};E.resolveEvent(f,0);
 ok('S1 첫째 선택은 투여량이 절반',f.dose===3,f.dose+'');
 ok('S1 정답 해설(첫째/둘째)이 새 문장',ev.why(b,0)==='APOE4 고위험 환자이거나 정기 MRI 감시가 없으면, 일단 투약을 멈추고 MRI로 확인한 뒤 다시 시작하는 것이 안전해요.'&&ev.why(a,1)==='정기 MRI 감시가 있고 증상이 없는 가벼운 부작용이면, 투약을 이어 가며 MRI로 지켜보는 것이 표준이에요. 실제 약은 용량을 줄이지 않고, 증상이 있거나 심하면 잠시 멈췄다가 다시 시작해요.');
 const g=mk(false);g.event={id:'aria_case',best:0};E.resolveEvent(g,2);
 ok('S1 아쉬운 선택의 기록에 새 해설이 담김',g.log[0].good===false&&g.log[0].why===ev.why(g,0)&&g.log[0].best==='투약을 잠시 멈추고 MRI로 확인');}
{const z=E.newState('antibody_house',1,'normal','early');z.trust=99;z.event={id:'funding',best:1};E.resolveEvent(z,1);
 ok('S4 사건 뒤 신뢰도는 100을 넘지 않음',z.trust<=100,z.trust+'');}
{let allInt=true;for(const co of Object.keys(E.COMPANIES))for(const sc of Object.keys(E.SCN)){const z=E.newState(co,1,'normal','early',sc);for(const id of Object.keys(E.NODE)){z.owned=['A1','B2'];if(!Number.isInteger(E.nodeCost(z,id).rp))allInt=false;}}
 ok('S2 모든 회사와 시나리오에서 개발 비용이 정수',allInt);}
{const z=E.newState('antibody_house',1,'normal','early');z.rp=99;z.lab.ethanol=1;
 const sentence='에탄올 용매는 항체(단백질)를 변성시켜 합성이 느려져요.';
 const r=E.buy(z,'B1','cool',true),lg=z.log[z.log.length-1];
 ok('S3 항체 약: 온도를 맞게 고르고 에탄올 용매를 써도 좋은 온도 선택으로 기록, 용매 문장이 뉴스',r===true&&lg.good===true&&z.news[0]===sentence&&z.pipeline[0].mult<1&&/^온도 선택은 알맞아 연구점수 \+\d+$/.test(z.news[1])&&z.news.every(t=>t.indexOf('수율이 좋아')<0),z.news.join(' | '));
 const w=E.newState('antibody_house',1,'normal','early');w.rp=99;w.lab.ethanol=1;E.buy(w,'B1','heat',true);
 ok('S3 온도가 틀리면 여전히 틀린 선택으로 기록',w.log[w.log.length-1].good===false);}
console.log(fails ? '\n' + fails + ' FAILED' : '\nALL PASS'); process.exit(fails ? 1 : 0);
