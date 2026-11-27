
// ===================== ENGINE (렌더러와 분리, 헤드리스 테스트 대상) =====================
var K = {
  WEEKS_PER_SEC: 1, TOTAL_WEEKS: 156, SHUTTLE_BONUS: 4.5, ANTIBODY_POLARITY: 3.0,
  SPREAD_RATE: 0.03, TAU_PENALTY: 0.6, ARIA_BASE: 0.012, APOE_RISK: 1.3, ARIA_EXP: 1.3, C_REF: 10,
  BUBBLES: false, RP_BASE: 3.0, ATOM_RATE: 0, ATOM_W: {C:.3,H:.3,O:.2,N:.2}, ATOM_CAP: 40,
  BUBBLE_EVERY: [6,14], BUBBLE_TTL: 4, BUBBLE_RP: 6, SYNTH_SEC_PER_RP: 0.6, PIPE_SLOTS: 3,
  CLEAR_K: 0.06, AMY_START: 50, AMY_GROWTH: 0.003, COG_K: 0.0055, COHORT: 40,
  TAU_THRESHOLD: 30, LOSE_TAU: 50, CATALYST_N: 2
};
var N = function(id,tree,name,rp,atoms,dH,req,reqAny,excl,mods,g,t,c){
  return {id:id,tree:tree,name:name,cost:Object.assign({rp:rp},atoms),dH:dH,req:req,reqAny:reqAny,excl:excl,mods:mods,gain:g,tradeoff:t,concept:c};
};
var NODES = [
 N('A1','A','지질친화성 조정 (logP 올리기)',8,{C:6,H:8},-1,[],[],[],{add:{logP:.6},mul:{}},'logP +0.6','수용성 -10%','비극성 영역이 클수록 지질막 통과가 쉬워져요'),
 N('A2','A','수소결합 주개 감소 (HBD 줄이기)',10,{O:4},-1,['A1'],[],[],{add:{HBD:-1},mul:{Kd:1.15}},'HBD -1','K_d 1.15배 (결합력 낮아짐)','떼어낼 수소결합이 적을수록 막을 넘기 쉬워요'),
 N('A3','A','극성 표면적 감소 (TPSA 줄이기)',12,{N:3,O:3},1,['A1'],[],[],{add:{TPSA:-20,plasmaBind:.08},mul:{}},'TPSA -20으로 뇌 도달률 올라감','혈장단백 결합 +8%로 유리약물 줄어듦','극성이 클수록 막 지질과의 상호작용이 불리해져요'),
 N('A4','A','분자량 축소 (MW 줄이기)',14,{C:10},1,['A2'],[],[],{add:{},mul:{MW:.8,Kd:1.25}},'MW 0.8배','K_d 1.25배 (접촉 면적 줄어듦)','작을수록 통과는 쉽지만 결합력이 줄어들어요'),
 N('A5','A','P-gp 유출 회피',16,{C:8,H:6},-1,['A3'],[],[],{add:{},mul:{retention:1.35}},'뇌 내 잔류율 +35%','없음','통과해도 다시 퍼내는 수송체가 있어요'),
 N('A6','A','Transferrin receptor shuttle',40,{C:20,H:24,N:8,O:10},-1,['A3','C3'],[],[],{add:{bbb:4.5},mul:{aria:.35},flag:{shuttle:1}},'bbbScore +4.5, ARIA 위험 0.35배','연구점수가 매우 많이 들어요 · 실제 셔틀 항체는 초기 임상에서 주입 반응이 절반 가까이 생겼고(전처치로 줄어듦), 가벼운 빈혈도 보고됐어요(약 8~13%).','TfR1 셔틀(2+1 이중특이 항체)로 크기·극성의 한계를 우회해요. 실제 trontinemab은 3상 진행 중이에요(미허가, 2026.11 기준)'),
 N('A7','A','SC 제형 전환',18,{H:6,O:4},1,[],['A6','B2'],[],{add:{},mul:{rp:1.25}},'rpRate +25%','없음','피하주사(SC) 제형으로 투여 편의가 좋아져요. 레카네맙 SC는 미국에서 2025년 8월 유지 투여용으로, 2026년 7월 시작 투여용으로 승인됐어요. ARIA를 줄인다는 근거는 없어요.'),
 N('B1','B','protofibril 선택성',10,{C:8,N:4},-1,[],[],[],{add:{},mul:{tau:.8,clear:.9}},'타우 확산 -20%','plaque 제거 -10%','가용성 응집체를 먼저 잡는 전략이에요 (lecanemab 계열)'),
 N('B2','B','plaque 선택성',10,{C:8,O:4},-1,[],[],[],{add:{},mul:{clear:1.35,aria:1.3}},'plaque 제거 +35%','ARIA 위험 1.3배 (도나네맙 ARIA-E 약 24% vs 레카네맙 12.6%)','침착된 플라크(N3pG)를 직접 제거하고, 제거 후 투약을 멈추는 한정 기간 치료예요 (donanemab 계열). 제거 후 투약을 멈춘 뒤에도 3년까지 진행을 늦추는 효과가 이어졌다고 보고됐지만(외부 비교군과 비교), 76주에 제거 기준을 못 채워 계속 투여한 군은 ARIA-E 24.2%·ARIA-H 37.6%로 더 높았어요 (사후 분석)'),
 N('B3','B','친화도 강화 (K_d 낮추기)',15,{N:6,O:4},-1,[],['B1','B2'],[],{add:{},mul:{Kd:.5}},'K_d 0.5배','없음','같은 농도에서 결합률이 올라가요 (평형상수의 의미)'),
 N('B4','B','pyroglutamate-Aβ 표적화',18,{C:10,N:5},1,['B2'],[],[],{add:{},mul:{clear:1.25}},'성숙 plaque 제거 +25%','없음','변형된 N 말단을 노리는 선택성이에요'),
 N('B5','B','Fc 조작 (microglia 활성 올리기)',20,{C:12,H:10},-1,['B3'],[],['B6'],{add:{},mul:{clear:1.3,aria:1.4}},'clearRate 1.3배','ariaRisk 1.4배','면역세포를 끌어들이면 제거는 빠르지만 혈관 염증이 커져요'),
 N('B6','B','Fc 사일싱',20,{C:12,O:6},1,['B3'],[],['B5'],{add:{},mul:{aria:.7,clear:.85}},'ariaRisk 0.7배','clearRate 0.85배','Fc 조작과 둘 중 하나만 고를 수 있어요'),
 N('B7','B','anti-tau 병용',45,{C:18,H:20,N:10,O:8},-1,['B3','C4'],[],[],{add:{},mul:{tau:.55}},'타우 확산 속도 -45%','연구비가 매우 커요','플라크를 걷어 낸 뒤에도 타우·염증은 이어지는 smoldering disease라서 아밀로이드만으로는 부족해요 (MTBR-tau 표적 항체 등 개발 중)'),
 N('C1','C','정기 MRI 모니터링',8,{},0,[],[],[],{add:{},mul:{trustDmg:.4},flag:{mri:1}},'ARIA 조기 발견, 신뢰도 피해 0.4배','연구점수만 사용','무증상 ARIA는 MRI로만 보여요. 레카네맙은 3·5·7·14회 투여 전에 안전성 MRI를 찍어요(미국 라벨, 2025.08 개정). ARIA는 첫 3~6개월에 집중돼요. 아직 어떤 검사로도 ARIA를 미리 정확히 예측하지는 못해요.'),
 N('C2','C','ApoE4 유전형 검사',10,{},0,[],[],[],{add:{},mul:{},flag:{apoe:1}},'동형접합 고위험군을 미리 가려 ARIA 위험 가산(1.3배) 제거','연구점수만 사용','ARIA-E 발생률은 ApoE4 비보인자 5.4% · 이형 10.9% · 동형 32.6% (CLARITY AD). 다만 ARIA-E의 59%는 동형접합이 아닌 환자에서 생겨 유전형만으로는 위험을 다 가려내지 못해요'),
 N('C3','C','혈장 pTau217 바이오마커',12,{},0,['C1'],[],[],{add:{braakShift:1},mul:{rp:1.1}},'시작 Braak 단계 -1, rpRate +10%','연구점수만 사용','혈액 p-tau217로 조기 진단을 도와요. 절단값을 두 개 쓰면 정확도가 약 90%까지 오르고, 애매한 결과(회색지대)는 20% 이하가 목표예요. 이 구간은 PET이나 뇌척수액으로 확인해요. 같은 p-tau217도 키트마다 절단값이 달라 따로 검증해야 해요.'),
 N('C4','C','단계적 증량 (titration)',14,{},0,['C1'],[],[],{add:{},mul:{aria:.65},flag:{titration:1}},'ariaRisk 0.65배','초기 26주 clearRate -20%','용량을 천천히 올리면 혈관이 적응할 시간을 벌어요. 도나네맙 점진 증량은 ARIA-E를 약 24%에서 15%로 낮췄어요 (무작위 비교)'),
 N('C5','C','투약 일시중단 프로토콜',12,{},0,['C4'],[],[],{add:{},mul:{},flag:{autoReduce:1}},'ARIA 발생 시 자동 감량, 피해 0.5배','연구점수만 사용','멈추는 것도 치료 전략이에요. 무증상·경도·안정이면 관찰하고, 증상이 있거나 중등도 이상이면 중단해요. ARIA-E는 3~4개월 안에 사라지는지 MRI로 확인하고 재개하고, ARIA-H(미세출혈)는 더 늘지 않는지(안정화) 확인해요'),
 N('C6','C','규제 패스트트랙',20,{},0,['C3'],[],[],{add:{},mul:{rp:1.2}},'rpRate +20%','연구점수만 사용','없음'),
 N('C7','C','환자 등록 확대',16,{},0,['C6'],[],[],{add:{},mul:{rp:1.3,aria:1.15}},'rpRate +30%','ARIA 이벤트 빈도 +15%','규모가 커지면 드문 부작용까지 드러나요')
];
var NODE = {}; NODES.forEach(function(n){NODE[n.id]=n;});
var COMBOS = [
 {id:'X1',name:'뇌 장벽 투과 최적화',req:['A2','A3'],mods:{add:{bbb:1.2},mul:{}}},
 {id:'X2',name:'저용량 고효율 요법',req:['A6','C4'],mods:{add:{},mul:{aria:.6}}},
 {id:'X3',name:'소분자 전환',req:['A4','B3'],mods:{add:{bbb:3.0},mul:{clear:.5}},warn:true},
 {id:'X4',name:'조기 개입',req:['B2','C3'],mods:{add:{},mul:{}},flag:{earlyIntervention:1}},
 {id:'X5',name:'이중 표적 셔틀',req:['A6','B7'],mods:{add:{},mul:{tau:.75}}}
];
var COMPANIES = {
 antibody_house:{name:'Antibody House',desc:'결합력 ★★★★★ · 표적 계열 비용 -20% · 첫 플레이 추천',mods:{add:{bbb:-1.0},mul:{Kd:.7,aria:1.2}},base:'ab',discount:{tree:'B',f:.8}},
 shuttle_lab:{name:'Shuttle Lab',desc:'뇌 장벽 기술 ★★★★★ · 「택배 셔틀 붙이기」 비용 -40%, 선행 조건 면제 (쉬움)',mods:{add:{},mul:{rp:.8}},base:'ab',discount:{id:'A6',f:.6},exempt:{A6:'C3'}},
 small_lab:{name:'Small-Molecule Lab',desc:'시작 약물이 소분자, 질병 수정 효과 낮음 (하드)',mods:{add:{},mul:{clear:.3}},base:'sm'}
};
var BASE_AB = {type:'ab',MW:148000,logP:0,HBD:0,TPSA:0,Kd:0.25,retention:.7,plasmaBind:.1,bbb:0,aria:1,clear:1,rp:1,tau:1,trustDmg:1,braakShift:0};
var BASE_SM = {type:'sm',MW:379,logP:4.1,HBD:0,TPSA:38.8,Kd:0.25,retention:.7,plasmaBind:.1,bbb:0,aria:1,clear:1,rp:1,tau:1,trustDmg:1,braakShift:0};
var X3_SM = {type:'sm',MW:450,logP:3.2,HBD:1,TPSA:60};
var REGIONS = [
 {id:'ento',ko:'내후각피질',braak:1,w:.10,to:['hippo'],xy:[232,232],tau:55},
 {id:'hippo',ko:'해마',braak:2,w:.18,to:['amyg'],xy:[200,210],tau:35},
 {id:'amyg',ko:'편도체',braak:3,w:.10,to:['itc'],xy:[255,213],tau:10},
 {id:'itc',ko:'하측두엽',braak:4,w:.14,to:['assoc','pfc'],xy:[130,205],tau:0},
 {id:'assoc',ko:'두정 연합',braak:5,w:.16,to:['occ','sm'],xy:[205,105],tau:0},
 {id:'pfc',ko:'전두엽',braak:5,w:.16,to:['sm'],xy:[325,135],tau:0},
 {id:'occ',ko:'후두엽',braak:6,w:.08,to:[],xy:[100,125],tau:0},
 {id:'sm',ko:'감각운동피질',braak:6,w:.08,to:[],xy:[264,100],tau:0}
];

// ---- 상황 변수: 환자군(환자 유형) · 난이도 · 이벤트 ----
K.EVENT_GAP=[14,24];
var PROFILES={
 early:{ko:'초기 단계 환자군',brief:'타우가 내후각·해마에 머물고 제거 반응이 좋은 환자들이에요. 아밀로이드를 공격적으로 걷어내는 쪽이 유리해요.',risk:1.2,clear:1.1,spread:1,amy:45,tau:{ento:38,hippo:12,amyg:0}},
 apoe4:{ko:'APOE4 고위험 환자군',brief:'아밀로이드 부담이 크고 부작용(뇌 부종·출혈)에 매우 취약한 환자들이에요. 유전형 선별·MRI·점진 증량이 핵심이고, 강한 제거 전략은 위험해요.',risk:3.2,clear:1,spread:1,amy:70,tau:{}},
 advanced:{ko:'진행 단계 환자군',brief:'타우가 이미 변연계·측두엽까지 퍼졌고 제거 반응이 약한 환자들이에요. 아밀로이드만으로는 부족해요. 항타우와 시간 싸움이에요.',risk:1.2,clear:.9,spread:1.15,amy:45,tau:{ento:65,hippo:50,amyg:28,itc:10}}
};
var SCN={std:{ko:'표준',d:'특별한 조건이 없어요',rp:1,aria:1,rival:1,cost:1},fast:{ko:'패스트 트랙',d:'심사가 빨라 드문 부작용을 덜 걸러 내요. 개발 비용 30% 할인, 부작용 위험 20% 증가.',rp:1,aria:1.2,rival:1,cost:.7},tight:{ko:'자금난',d:'연구점수가 25% 덜 들어와요. 대신 경쟁사도 느려져요',rp:.75,aria:1,rival:.8,cost:1}};
var WAVES=[
 {id:'apoe4',ko:'APOE4 보유 환자군이 합류했어요',d:'부작용에 더 취약해요. 부작용 위험 1.2배, 아밀로이드 +4',fx:function(st){st.ariaPerm*=1.2;st.regions.forEach(function(r){r.amy=Math.min(100,r.amy+4);});}},
 {id:'advanced',ko:'진행기 환자군이 합류했어요',d:'타우가 이미 퍼져 있어요. 내후각·해마 타우 +8',fx:function(st){st.regions.forEach(function(r){if(r.id==='ento'||r.id==='hippo')r.tau=Math.min(100,r.tau+8);});}},
 {id:'early',ko:'조기 진단 환자군이 합류했어요',d:'제거 반응이 좋아요. 아밀로이드 -4, 인지 기능 +3',fx:function(st){st.regions.forEach(function(r){r.amy=Math.max(0,r.amy-4);});st.cognition=Math.min(100,st.cognition+3);}},
 {id:'vascular',ko:'혈관 질환을 함께 가진 환자군이 합류했어요',d:'뇌혈관이 약해요. 부작용 위험 1.1배, 연구점수 +15',fx:function(st){st.ariaPerm*=1.1;st.rp+=15;}}
];
var WAVE_WEEKS=[26,62,100];
var PHASES=['평시','확산 시작','광범위 확산','위기'];
function phaseOf(st){var n=st.regions.filter(function(r){return r.tau>=20;}).length;return n>=5?3:n>=3?2:n>=1?1:0;}
function achievements(st){var o=st.over||{};return [{ko:'부작용 없이 완주',ok:!!o.win&&st.ariaCount===0},{ko:'경쟁사 승인 전에 완주',ok:!!o.win&&!st.rivalWon},{ko:'작용기 3개 장착',ok:st.groups.length>=K.MAX_GROUPS},{ko:'연구점수 100 이상 남김',ok:!!o.win&&st.rp>=100},{ko:'첫 임상 시험 통과',ok:!!st.trialPassed},{ko:'실패 뒤 재설계로 통과',ok:!!st.redesign},{ko:'도감 완성',ok:Object.keys(st.disc||{}).length>=Object.keys(LAB).length}];}
var ADVISORS={
 safety:{ko:'안전성 자문위원',d:'부작용 위험 15% 감소',fx:function(st){st.ariaPerm*=.85;}},
 tau:{ko:'타우 연구 자문위원',d:'타우 확산 10% 감소',fx:function(st){st.tauPerm*=.9;}},
 fund:{ko:'연구비 자문위원',d:'연구점수가 10% 더 들어와요',fx:function(st){st.rpPerm*=1.1;}},
 reg:{ko:'규제 자문위원',d:'경쟁사 진행 10% 느려짐',fx:function(st){st.rivalRate*=.9;}},
 patient:{ko:'환자단체 자문위원',d:'신뢰도 +10으로 시작',fx:function(st){st.trust=Math.min(100,st.trust+10);}}};
function applyAdvisor(st,id){var a=ADVISORS[id];if(!a||st.adv)return false;a.fx(st);st.adv=id;return true;}
var DIFF={easy:{ko:'쉬움',aria:.8,spread:.8,rival:190},normal:{ko:'보통',aria:1,spread:1,rival:135},hard:{ko:'어려움',aria:1.25,spread:1.2,rival:105}};
function amyAvg(st){return st.regions.reduce(function(s,r){return s+r.amy;},0)/8;}
function rawApoe4(st){return st.profile==='apoe4'&&!st.drug.flags.apoe;}
var EVENTS=[
 {id:'aria_case',min:8,max:110,ok:function(st){return st.ariaCount>=1;},
  title:'첫 부작용 사례',text:'투약 중인 환자 한 명에게서 부작용(뇌 부종·출혈) 소견이 보고됐어요. 임상 현장이 당신의 대응을 기다려요.',
  ch:[{l:'투약을 잠시 멈추고 MRI로 확인',d:'투여량이 절반이 되고, 신뢰도 +3 (정기 MRI 감시가 있으면 +8)'},{l:'투약을 이어 가며 MRI로 지켜보기',d:'투여량은 그대로, 신뢰도 +2'},{l:'추가 확인 없이 계속 투약',d:'연구점수 +10, 신뢰도 -3 (APOE4 고위험 환자군인데 유전자 검사를 안 했으면 -14)'}],
  best:function(st){return rawApoe4(st)?0:(st.drug.flags.mri?1:0);},
  why:function(st,b){return b===0?'APOE4 고위험 환자이거나 정기 MRI 감시가 없으면, 일단 투약을 멈추고 MRI로 확인한 뒤 다시 시작하는 것이 안전해요.':'정기 MRI 감시가 있고 증상이 없는 가벼운 부작용이면, 투약을 이어 가며 MRI로 지켜보는 것이 표준이에요. 실제 약은 용량을 줄이지 않고, 증상이 있거나 심하면 잠시 멈췄다가 다시 시작해요.';},
  act:function(st,i){
   if(i===0){st.dose=Math.max(1,st.dose*.5);st.trust+=st.drug.flags.mri?8:3;return '투약을 잠시 멈추고 MRI로 확인했어요. 투여량이 절반이 됐어요.';}
   if(i===1){st.trust+=2;return st.drug.flags.mri?'투약을 이어 가며 MRI로 지켜봐요.':'정기 MRI 감시 없이 투약을 이어 가요. 부작용을 늦게 알아챌 수 있어요.';}
   var r=rawApoe4(st);st.trust-=r?14:3;st.rp+=10;return r?'APOE4 환자에게서 추가 사례가 나와 신뢰도가 크게 떨어졌어요.':'큰 문제 없이 지나갔지만 신뢰도가 조금 깎였어요.';}},
 {id:'rival_data',min:25,max:95,ok:function(){return true;},
  title:'경쟁사 임상 결과 발표',text:'경쟁사가 3상 중간 결과를 학회에서 공개했어요. 시장의 시선이 쏠려요.',
  ch:[{l:'우리 데이터를 조기 공개',d:'경쟁사 진척 -12. 데이터가 약하면 역풍'},{l:'안전성 데이터 보강',d:'신뢰도 +5, 경쟁은 그대로'},{l:'연구비 증액·가속',d:'연구점수 +40, 6개월간 부작용 위험 1.25배'}],
  best:function(st){return st.cognition>=85?0:(st.trust<70?1:2);},
  why:function(st,b){return b===0?'인지 기능이 잘 유지되고 있어 데이터가 강해요. 먼저 공개하면 유리해요.':b===1?'신뢰도가 낮을 때 서두르면 안전성 우려가 커져요. 안전성 근거부터 쌓으세요.':'데이터도 신뢰도도 어중간하면 자원을 늘려 속도를 내는 편이 나아요.';},
  act:function(st,i){
   if(i===0){if(st.cognition>=85){st.rival=Math.max(0,st.rival-12);st.trust+=3;return '선점에 성공해 경쟁사 진척을 늦췄어요.';}st.trust-=10;return '데이터가 약해 역풍을 맞았어요.';}
   if(i===1){st.trust+=5;return '안전성 근거를 보강했어요.';}
   st.rp+=40;st.ariaBuff={mul:1.25,until:st.week+26};return '자원을 늘렸지만 6개월간 부작용 위험이 올라가요.';}},
 {id:'fast_approval',min:55,max:125,ok:function(st){return amyAvg(st)<48;},
  title:'규제당국 조건부 승인 제안',text:'규제당국이 확증 시험을 조건으로 가속(조건부) 승인을 제안했어요.',
  ch:[{l:'조건부 승인 수락',d:'연구점수 +30, 신뢰도 +10, 경쟁사 -15, 환자군이 넓어져 부작용 위험 1.15배(영구)'},{l:'정식 승인까지 대기',d:'변화 없음'}],
  best:function(st){return (st.trust<65||st.rival>60)?0:1;},
  why:function(st,b){return b===0?'신뢰도가 낮거나 경쟁사가 앞서 가고 있다면 조건부 승인이 시간을 벌어 줘요.':'신뢰도도 여유 있고 경쟁도 느긋하면, 환자군이 넓어져 부작용이 늘어날 위험을 떠안을 이유가 없어요.';},
  act:function(st,i){if(i===0){st.trust+=10;st.rp+=30;st.ariaPerm*=1.15;st.rival=Math.max(0,st.rival-15);return '조건부 승인으로 자원과 신뢰를 얻었지만 안전성 부담이 커져요.';}return '정식 승인까지 기다려요.';}},
 {id:'tau_surge',min:30,max:115,ok:function(st){return st.regions[3].tau>25;},
  title:'타우 PET: 확산 가속',text:'하측두피질까지 타우가 번졌다는 PET 소견이 나왔어요. 연구 방향을 정해야 해요.',
  ch:[{l:'anti-tau 병용 연구 확대',d:'연구점수 -25, 타우 확산 -12% (영구)'},{l:'아밀로이드 제거 강화',d:'투여량 +1.5, 아밀로이드 -10'},{l:'관찰만 하며 자원 비축',d:'연구점수 +15, 타우 확산 +5%'}],
  best:function(st){return st.profile==='advanced'?0:1;},
  why:function(st,b){return b===0?'이미 타우가 퍼진 진행기 환자는 아밀로이드를 걷어도 타우가 계속 진행해요(smoldering disease). 항타우가 답이에요.':'초기·고위험 환자는 아밀로이드가 타우 확산의 씨앗이므로 제거를 강화하는 편이 먼저예요 (단 APOE4는 부작용 감시 필수).';},
  act:function(st,i){
   if(i===0){st.rp=Math.max(0,st.rp-25);st.tauPerm*=.88;return '항타우 연구에 투자했어요. 확산 속도가 영구히 줄었어요.';}
   if(i===1){st.dose=Math.min(10,st.dose+1.5);st.regions.forEach(function(r){r.amy=Math.max(0,r.amy-10);});return st.profile==='advanced'?'아밀로이드는 줄었지만 이미 퍼진 타우에는 효과가 제한적이에요.':'아밀로이드를 걷어내 타우 확산의 씨앗을 줄였어요.';}
   st.rp+=15;st.tauPerm*=1.05;return '관찰만 한 사이 타우가 조금 더 빨라졌어요.';}},
 {id:'funding',min:35,max:105,ok:function(){return true;},
  title:'연구비 위기',text:'투자 라운드가 지연되고 있어요. 어떻게 자금을 확보할까요?',
  ch:[{l:'대형 제약사와 라이선스',d:'연구점수 +60, 이후 연구점수 수익 -8% (영구)'},{l:'정부 과제 신청',d:'연구점수 +25, 신뢰도 +3'},{l:'현 체제 유지',d:'변화 없음'}],
  best:function(st){return st.rp<25?0:(st.rp<80?1:2);},
  why:function(st,b){return b===0?'자원이 바닥이라면 수익을 나눠서라도 큰 자금이 필요해요.':b===1?'급하지는 않으니 조건 없는 정부 과제가 가성비가 좋아요.':'자원이 충분하면 수익을 내줄 이유가 없어요.';},
  act:function(st,i){if(i===0){st.rp+=60;st.rpPerm*=.92;return '라이선스 계약으로 자금은 확보했지만 수익을 나눠요.';}if(i===1){st.rp+=25;st.trust+=3;return '정부 과제를 받았어요.';}return '현 체제를 유지해요.';}},
 {id:'dsmb',min:85,max:145,ok:function(){return true;},
  title:'안전성 감시 위원회 중간 분석',text:'안전성 감시 위원회가 중간 안전성·효능 자료를 검토하고 투여량 방침을 물어요.',
  ch:[{l:'용량 20% 감량',d:'신뢰도 +4'},{l:'현행 유지',d:'변화 없음'},{l:'용량 +1 증량',d:'제거 속도와 부작용 위험이 함께 올라요'}],
  best:function(st){return (st.trust<55||rawApoe4(st))?0:(amyAvg(st)>35&&st.trust>=70?2:1);},
  why:function(st,b){return b===0?'신뢰도가 낮거나 APOE4 고위험 환자가 선별되지 않았다면 안전 마진이 우선이에요.':b===2?'신뢰도가 충분하고 아밀로이드가 아직 높다면 증량으로 목표에 닿아야 해요.':'지금 설정이 안전과 효능의 균형점이에요.';},
  act:function(st,i){if(i===0){st.dose=Math.max(1,st.dose*.8);st.trust+=4;return '용량을 줄였어요.';}if(i===1)return '용량을 유지해요.';st.dose=Math.min(10,st.dose+1);if(rawApoe4(st)){st.trust-=10;return '증량 후 APOE4 환자에게서 부작용이 늘었어요.';}return '용량을 올렸어요.';}},
 // ---- 실제 사례·뉴스에서 영감을 받은 시나리오 (수치·결과는 가상) ----
 {id:'label_warning',real:'FDA는 2023년 레카네맙 정식 승인 때 ApoE4 동형접합자의 부작용(뇌 부종·출혈) 위험을 라벨에 경고로 올렸어요.',min:30,max:120,ok:function(st){return st.ariaCount>=1;},
  title:'규제당국, 안전성 라벨 강화 요구',text:'당국이 부작용(뇌 부종·출혈) 위험, 특히 APOE4 보인자의 위험을 라벨 경고에 넣고 MRI 감시 일정을 명시하라고 요구했어요.',
  ch:[{l:'전면 수용 + MRI 일정 강화',d:'연구점수 -10, 신뢰도 +5'},{l:'일부 문구에 이의 제기',d:'받아들여지면 무사, 아니면 신뢰도 하락'}],
  best:function(st){return (rawApoe4(st)||!st.drug.flags.mri)?0:1;},
  why:function(st,b){return b===0?'고위험군을 못 가렸거나 MRI 감시 체계가 없으면 이의 제기는 근거가 약해 역풍을 맞아요.':'이미 MRI 감시와 선별 체계를 갖췄다면 불필요한 경고 문구에는 근거를 들어 이의를 제기할 수 있어요.';},
  act:function(st,i){if(i===0){st.rp=Math.max(0,st.rp-10);st.trust+=5;return '라벨을 수용해 당국과 신뢰를 쌓았어요.';}if(st.drug.flags.mri&&!rawApoe4(st)){st.trust+=2;return '근거 자료가 받아들여졌어요.';}st.trust-=9;return '근거가 부족해 이의가 기각되고 신뢰가 떨어졌어요.';}},
 {id:'retraction',real:'2022년 아밀로이드 베타 연구 부정 의혹이 불거졌고, 영향력 큰 2006년 Nature 논문은 2024년 철회됐어요. 아밀로이드 가설 전체가 틀렸다는 뜻은 아니지만 논란이 커졌어요.',min:35,max:120,ok:function(){return true;},
  title:'핵심 논문 철회 스캔들',text:'아밀로이드 연구의 유명 논문 일부가 조작 의혹으로 철회됐다는 보도가 쏟아져요. 투자자와 의료진이 아밀로이드 전략을 다시 물어요.',
  ch:[{l:'독립 재현 데이터 공개',d:'연구점수 -20, 신뢰도 +6'},{l:'타우 등 다른 표적 강조로 전환',d:'타우 확산 -5% (영구)'},{l:'공식 대응 없이 지켜보기',d:'변화 없음'}],
  best:function(st){return (st.owned.indexOf('B7')>=0||st.profile==='advanced')?1:0;},
  why:function(st,b){return b===0?'우리 약이 아밀로이드 제거에 의존한다면 독립 재현 데이터로 신뢰를 지켜야 해요.':'진행기 환자이거나 타우 전략을 병행하고 있다면, 다른 표적을 강조하는 편이 나아요.';},
  act:function(st,i){if(i===0){st.rp=Math.max(0,st.rp-20);st.trust+=6;return '재현 데이터가 신뢰를 지켰어요.';}if(i===1){st.tauPerm*=.95;st.trust+=(st.owned.indexOf('B7')>=0?3:-3);return st.owned.indexOf('B7')>=0?'다중 표적 전략이 호평을 받았어요.':'항타우 근거가 부족해 설득력이 약했어요.';}st.trust-=4;return '침묵이 길어지며 불안이 커졌어요.';}},
 {id:'strike',real:'2024년 한국에서는 전공의 집단 사직으로 대형병원 진료·임상시험 운영이 흔들렸어요.',min:30,max:120,ok:function(){return true;},
  title:'의사 파업으로 임상 현장 마비',text:'의료 파업으로 주요 병원의 영상 촬영·환자 방문이 줄었어요. 환자 모집과 모니터링에 차질이 생겼어요.',
  ch:[{l:'원격 모니터링 + 지방 센터 확대',d:'연구점수 -15, 피해 최소화'},{l:'모집 중단 후 사태 종료 대기',d:'연구점수 수익 -5% (영구)'},{l:'해외 센터로 일부 이관',d:'연구점수 -30, 신뢰도 +3'}],
  best:function(st){return st.rp<40?1:(st.drug.flags.mri?0:2);},
  why:function(st,b){return b===1?'자원이 부족하면 비싼 대응보다 일단 멈추고 비용을 아끼는 것이 나아요.':b===0?'이미 MRI 모니터링 체계가 있다면 원격·지방 센터로 쉽게 이어 갈 수 있어요.':'MRI 체계가 없는데 자원이 있다면 해외 센터로 분산하는 편이 안전해요.';},
  act:function(st,i){if(i===0){st.rp=Math.max(0,st.rp-15);return '원격 모니터링으로 피해를 줄였어요.';}if(i===1){st.rpPerm*=.95;return '모집을 멈춰 비용은 아꼈지만 속도가 느려졌어요.';}st.rp=Math.max(0,st.rp-30);st.trust+=3;return '해외 센터로 분산해 안정시켰어요.';}},
 {id:'rival_drug',real:'레카네맙에 이어 도나네맙이 허가되고 피하주사 제형 등이 이어지며 항체 치료제 경쟁이 가열됐어요.',min:40,max:120,ok:function(){return true;},
  title:'경쟁 항체 허가 확대',text:'경쟁사 약물이 새 제형·적응증으로 허가를 넓혔어요. 병원들이 비교 자료를 요구해요.',
  ch:[{l:'가격 인하로 맞대응',d:'연구점수 수익 -5% (영구), 경쟁사 -6'},{l:'안전성 차별화 홍보',d:'신뢰도 +4'},{l:'대응 없이 연구에 집중',d:'변화 없음'}],
  best:function(st){return st.trust<70?1:(st.rival>55?0:2);},
  why:function(st,b){return b===1?'신뢰도가 낮다면 가격보다 안전성 근거로 차별화해야 해요.':b===0?'경쟁사가 앞서 가고 있다면 가격으로 시간을 벌어야 해요.':'지금 우위가 있다면 불필요한 출혈 대신 연구에 집중하세요.';},
  act:function(st,i){if(i===0){st.rpPerm*=.95;st.rival=Math.max(0,st.rival-6);return '가격 인하로 경쟁사를 늦췄어요.';}if(i===1){st.trust+=4;return '안전성 근거가 호평을 받았어요.';}return '연구에 집중해요.';}},
 {id:'congress',min:10,max:150,ok:function(st){return !!(st.lastTrial&&st.lastTrial.pass);},
  title:'학회 초청: 임상 결과 발표',text:'지난 임상 시험 통과 소식에 국제 학회가 발표를 요청했어요. 어디까지 공개할지 정해야 해요.',
  ch:[{l:'데이터 전면 공개',d:'신뢰도 +6, 경쟁사 진행 +4'},{l:'핵심만 발표',d:'신뢰도 +2, 연구점수 +10'},{l:'발표 사양',d:'변화 없음'}],
  best:function(st){return st.trust<70?0:1;},
  why:function(st,b){return b===0?'신뢰도가 낮을 땐 경쟁사에 정보를 주더라도 투명성으로 신뢰를 쌓는 편이 나아요.':'신뢰도에 여유가 있으니 핵심만 알리고 연구 자원을 챙기는 편이 효율적이에요.';},
  act:function(st,i){if(i===0){st.trust+=6;st.rival=Math.min(99,st.rival+4);return '전면 공개로 신뢰를 얻었지만 경쟁사도 힌트를 얻었어요.';}if(i===1){st.trust+=2;st.rp+=10;return '핵심 결과만 발표했어요.';}return '발표를 미뤘어요.';}},
 {id:'trial_press',min:20,max:150,ok:function(st){return (st.failStreak||0)>=2&&!!(st.lastTrial&&!st.lastTrial.pass);},
  title:'언론: 임상 연속 실패',text:'임상 시험이 연달아 통과하지 못했다는 기사가 나왔어요. 투자자와 환자들이 불안해해요.',
  ch:[{l:'재설계 계획 공개',d:'연구점수 -10, 신뢰도 +5'},{l:'공식 대응 없음',d:'신뢰도 -5'}],
  best:function(st){return st.rp>=10?0:1;},
  why:function(st,b){return b===0?'연구점수 여유가 있다면 다음 설계 계획을 보여 주는 편이 신뢰 하락을 막아요.':'연구점수가 바닥이라면 지금은 버티고 다음 시험에 집중해야 해요.';},
  act:function(st,i){if(i===0){st.rp=Math.max(0,st.rp-10);st.trust+=5;return '다음 설계 계획을 공개해 불안을 달랬어요.';}st.trust-=5;return '침묵이 불신을 키웠어요.';}},
 {id:'cms_registry',real:'미국 메디케어는 항아밀로이드 항체를 환자 등록(레지스트리) 조건으로 급여했어요.',min:45,max:125,ok:function(){return true;},
  title:'보험 급여 조건: 환자 등록 의무',text:'보험당국이 급여 조건으로 모든 투약 환자를 장기 등록(레지스트리)하라고 요구했어요. 행정 부담이 커요.',
  ch:[{l:'조건 수용',d:'연구점수 -15, 신뢰도 +6'},{l:'조건 완화 협상',d:'연구점수 -5, 신뢰도 +3'},{l:'거부',d:'신뢰도 -6'}],
  best:function(st){return st.trust<75?0:1;},
  why:function(st,b){return b===0?'신뢰도가 낮다면 비용이 들어도 조건을 받아들여 안전망을 보여 주는 편이 나아요.':'신뢰도에 여유가 있으니 비용을 줄이는 협상이 효율적이에요.';},
  act:function(st,i){if(i===0){st.rp=Math.max(0,st.rp-15);st.trust+=6;return '등록 체계를 갖춰 신뢰를 얻었어요.';}if(i===1){st.rp=Math.max(0,st.rp-5);st.trust+=3;return '부담을 줄이는 선에서 합의했어요.';}st.trust-=6;return '거부로 급여 협상이 틀어졌어요.';}},
 {id:'blood_test',real:'2025년 5월 미국에서 알츠하이머 진단을 돕는 혈액 검사(p-tau217)가 처음 허가됐어요. 증상이 있는 55세 이상이 대상이고, 다른 검사와 함께 판단해야 해서 PET 검사를 줄일 수 있어요.',min:30,max:110,ok:function(){return true;},
  title:'혈액검사 허가로 진단 확대',text:'혈액 p-tau217 검사가 허가됐어요. 증상이 있는 환자의 진단을 훨씬 싸게 도울 수 있게 됐어요.',
  ch:[{l:'혈액 검사 즉시 도입',d:'연구점수 +15 (「혈액으로 조기 진단」을 개발했다면 +30, 신뢰도 +3)'},{l:'PET 중심 진단 유지',d:'신뢰도 +2, 연구점수 -5'}],
  best:function(st){return st.owned.indexOf('C3')>=0?0:1;},
  why:function(st,b){return b===0?'이미 혈액으로 조기 진단하는 체계(「혈액으로 조기 진단」)가 있어 새 검사를 바로 활용할 수 있어요.':'바이오마커 체계가 없으면 검증 없이 도입하기보다 PET으로 확인하는 것이 안전해요.';},
  act:function(st,i){if(i===0){if(st.owned.indexOf('C3')>=0){st.rp+=30;st.trust+=3;return '혈액 검사로 환자 모집이 빨라졌어요.';}st.rp+=15;st.trust-=4;return '검증 체계가 없어 오분류가 생겼어요.';}st.rp=Math.max(0,st.rp-5);st.trust+=2;return 'PET으로 확인해 정확도를 지켰어요.';}},
 {id:'cold_chain',real:'항체 의약품은 냉장 유통이 필수라 물류 장애가 곧 공급 차질로 이어져요.',min:30,max:120,ok:function(st){return st.drug.type==='ab';},
  title:'냉장 유통망 장애',text:'폭염과 물류 차질로 항체 약물의 냉장 유통망에 문제가 생겼어요. 일부 병원에서 보관 온도가 벗어났어요.',
  ch:[{l:'비상 재고로 교체 공급',d:'연구점수 -20, 신뢰도 유지'},{l:'해당 물량 폐기 후 재공급 대기',d:'신뢰도 -3'}],
  best:function(st){return st.rp>=30?0:1;},
  why:function(st,b){return b===0?'자원에 여유가 있으니 즉시 교체해 환자 공백을 막는 편이 나아요.':'자원이 부족하면 무리한 교체보다 폐기 후 재공급을 기다려 비용을 지키세요.';},
  act:function(st,i){if(i===0){st.rp=Math.max(0,st.rp-20);return '비상 재고를 풀어 공급 공백을 막았어요.';}st.trust-=3;return '재공급까지 일부 환자의 투약이 밀렸어요.';}},
 {id:'aria_death',real:'레카네맙·도나네맙 투약 환자의 사망 사례가 언론에 보도되며 안전성 논쟁이 일었어요.',min:50,max:130,ok:function(st){return st.ariaCount>=3;},
  title:'부작용 관련 사망 사례 보도',text:'뇌출혈로 사망한 환자가 부작용(뇌 부종·출혈)과 연관됐을 수 있다는 보도가 나왔어요. 의료진과 가족이 설명을 요구해요.',
  ch:[{l:'독립 안전성 위원회 소집 + 투약 감량',d:'용량 30% 감량, 신뢰도 +6'},{l:'개별 사례 조사 결과를 기다림',d:'신뢰도 -5 (고위험군이면 -15)'},{l:'공식 해명 발표',d:'신뢰도 +2, MRI가 있으면 +5'}],
  best:function(st){return (rawApoe4(st)||!st.drug.flags.mri)?0:2;},
  why:function(st,b){return b===0?'고위험군을 못 가렸거나 모니터링이 부족하면 해명보다 먼저 안전 조치를 보여 줘야 해요.':'MRI 감시와 선별 체계로 데이터를 보여 줄 수 있다면 투명한 해명이 가장 효과적이에요.';},
  act:function(st,i){if(i===0){st.dose=Math.max(1,st.dose*.7);st.trust+=6;return '독립 위원회와 감량으로 불안을 가라앉혔어요.';}if(i===1){st.trust-=rawApoe4(st)?15:5;return '기다리는 사이 여론이 악화됐어요.';}st.trust+=st.drug.flags.mri?5:2;return st.drug.flags.mri?'MRI 데이터를 근거로 설득력 있게 해명했어요.':'근거가 부족해 해명 효과가 작았어요.';}}
];


function rng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function applyMods(s,m,f){ // 덧셈, 곱셈, 플래그 순서 고정
  for(var k in (m.add||{})) s[k]=(s[k]||0)+m.add[k];
  for(var k2 in (m.mul||{})) s[k2]=(s[k2]===undefined?1:s[k2])*m.mul[k2];
}
var LAB={
 ethanol:{ko:'에탄올',f:'C2H6O',atoms:{C:2,H:6,O:1},use:'용매로 쓰면 작은 분자 약은 합성이 30% 빨라지고, 항체(단백질)는 변성돼 40% 느려져요. 하이드록시기(-OH) 작용기로 붙이면 표적에 더 세게 붙어요.'},
 acetic:{ko:'아세트산',f:'C2H4O2',atoms:{C:2,H:4,O:2},use:'촉매 합성(재료 1개 소모)에 필요해요. 실제 촉매는 반응 뒤에도 그대로 남지만, 이 게임에서는 한 번 쓰면 없어져요. 카복실기(-COOH)로 붙이면 붙는 힘이 늘지만 부작용이 조금 늘어요.'},
 ammonia:{ko:'암모니아',f:'NH3',atoms:{N:1,H:3},use:'아미노기(-NH2) 작용기로 붙이면 표적에 아주 세게 붙지만 뇌 장벽 통과가 나빠져요.'},
 amide:{ko:'아세트아마이드',f:'C2H5NO',atoms:{C:2,H:5,N:1,O:1},use:'아마이드기(-CONH2)로 붙이면 잘 끊어지지 않아서 약이 몸속에서 더 오래 버텨요.'}
};
var GROUPS={
 ethanol:{ko:'하이드록시기 (-OH)',mods:{add:{HBD:1},mul:{Kd:.9}}},
 acetic:{ko:'카복실기 (-COOH)',mods:{add:{TPSA:10},mul:{Kd:.88,aria:1.1}}},
 ammonia:{ko:'아미노기 (-NH2)',mods:{add:{HBD:1,TPSA:6},mul:{Kd:.8}}},
 amide:{ko:'아마이드기 (-CONH2)',mods:{add:{TPSA:6},mul:{retention:1.15}}}
};
K.GRADE={WIN_COG:50,WIN_AMY:20,S_COG:75,S_TRUST:70,A_COG:60};K.MAX_GROUPS=3;K.DISC_RP=6;K.DISC_RP_MISS=2;
K.ORDER_BASE=6; K.ORDER_ATOMS=3;
function orderCost(st){return Math.round(K.ORDER_BASE*(1+.5*st.orders));}
function labOrder(st,a){var c=orderCost(st);if(!{C:1,H:1,O:1,N:1}[a])return '없는 원소';if(st.rp<c)return '연구점수 부족 (시약 주문 '+c+')';st.rp-=c;st.orders++;st.atoms[a]=Math.min(K.ATOM_CAP,st.atoms[a]+K.ORDER_ATOMS);say(st,'시약 주문: '+{C:'탄소',H:'수소',O:'산소',N:'질소'}[a]+' +'+K.ORDER_ATOMS+' (연구점수 -'+c+')');return true;}
function labCraft(st,id,correct){var r=LAB[id];if(!r)return '없는 레시피';for(var a in r.atoms)if(st.atoms[a]<r.atoms[a])return '재료 부족';
 for(var b in r.atoms)st.atoms[b]-=r.atoms[b];st.lab[id]++;st.disc=st.disc||{};if(!st.disc[id]){var bn=correct===false?K.DISC_RP_MISS:K.DISC_RP;st.disc[id]=1;st.rp+=bn;say(st,r.ko+' 첫 합성, 도감에 등록했어요. 연구점수 +'+bn);}else say(st,r.ko+' 합성 완료');return true;}
function labAttach(st,id){var g=GROUPS[id];if(!g||st.lab[id]<1)return '재고 없음';if(st.groups.length>=K.MAX_GROUPS)return '작용기는 '+K.MAX_GROUPS+'개까지';
 if(st.groups.indexOf(id)>=0)return '이미 붙였어요';st.lab[id]--;st.groups.push(id);st.drug=computeDrug(st.company,st.owned,st.combos,st.groups);say(st,'약에 '+g.ko.replace(' (','(')+'를 붙였어요');return true;}
function computeDrug(company, owned, combos, groups){
  var co=COMPANIES[company]; var s=Object.assign({},co.base==='sm'?BASE_SM:BASE_AB); s.flags={};
  var list=owned.map(function(i){return NODE[i];});
  var cm=combos.map(function(i){return COMBOS.filter(function(c){return c.id===i;})[0];});
  if(combos.indexOf('X3')>=0) Object.assign(s,X3_SM);
  var gl=(groups||[]).map(function(i){var g=GROUPS[i];return {mods:(s.type==='ab')?{add:{},mul:Object.assign({},g.mods.mul,{aria:(g.mods.mul.aria||1)*1.1})}:g.mods};});
  var hasG=function(x){return groups&&groups.indexOf(x)>=0;};
  if(hasG('ethanol')&&hasG('acetic'))gl.push({mods:{add:{},mul:{Kd:.9}}});
  if(hasG('ammonia')&&hasG('acetic'))gl.push({mods:{add:{},mul:{retention:1.1}}});
  var src=[{mods:co.mods}].concat(list).concat(cm).concat(gl);
  src.forEach(function(x){for(var k in (x.mods.add||{})) s[k]=(s[k]||0)+x.mods.add[k];});
  src.forEach(function(x){for(var k in (x.mods.mul||{})) s[k]=(s[k]===undefined?1:s[k])*x.mods.mul[k];});
  list.concat(cm).forEach(function(x){var f=x.mods&&x.mods.flag||x.flag||{};for(var k in f) s.flags[k]=f[k];});
  s.polarity = s.type==='ab' ? K.ANTIBODY_POLARITY : .45*s.HBD+.012*s.TPSA-.35*s.logP;
  s.size = Math.log10(s.MW)-2.6;
  s.bbbScore = 6.0-2.0*s.polarity-2.6*s.size+s.bbb;
  s.uptake = 90/(1+Math.exp(-s.bbbScore));
  return s;
}
function braakNow(st){var b=0;st.regions.forEach(function(r){if(r.tau>K.TAU_THRESHOLD&&r.braak>b)b=r.braak;});return b;}
function theta(d,dose){var brain=dose*(1-d.plasmaBind)*d.uptake/100*d.retention;return brain/(brain+d.Kd);}
function derive(st){
  var d=st.drug, bk=Math.max(0,braakNow(st)-(d.braakShift||0));
  var th=theta(d,st.dose);
  var clearMul=d.clear*((d.flags.titration&&st.week<26)?.8:1);
  var P=PROFILES[st.profile],D=DIFF[st.diff],buff=st.week<st.ariaBuff.until?st.ariaBuff.mul:1;
  var clear=K.CLEAR_K*th*clearMul*P.clear*(1-K.TAU_PENALTY*bk/6);
  var aria=K.ARIA_BASE*Math.pow(st.dose/K.C_REF,K.ARIA_EXP)*d.aria*(d.flags.apoe?1:P.risk)*D.aria*st.ariaPerm*buff;
  return {theta:th,clear:clear,aria:aria,rpRate:K.RP_BASE*d.rp*st.rpPerm*(st.rivalWon?.85:1),tauSpread:K.SPREAD_RATE*d.tau*D.spread*P.spread*st.tauPerm};
}
function nodeCost(st,id){
  var n=NODE[id],c=Object.assign({},n.cost),co=COMPANIES[st.company],f=1;
  if(co.discount&&((co.discount.tree&&co.discount.tree===n.tree)||co.discount.id===id)) f=co.discount.f;
  var same=st.owned.filter(function(o){return NODE[o].tree===n.tree;}).length;c={rp:Math.round(c.rp*f*(1+.05*same)*(st.costMul||1))}; return c; // CHON은 합성 실험실 전용
}
function newState(company,seed,diff,profile,scn){
  var rand=rng(seed||1); diff=DIFF[diff]?diff:'normal';
  if(!PROFILES[profile]) profile=['early','apoe4','advanced'][Math.floor(rand()*3)];
  var P=PROFILES[profile];
  var st={week:0,paused:true,speed:1,rp:0,atoms:{C:6,H:10,O:4,N:2},atomAcc:0,orders:0,lab:{ethanol:0,acetic:0,ammonia:0,amide:0},groups:[],owned:[],combos:[],pipeline:[null,null,null],
    dose:5,regions:REGIONS.map(function(r){return {id:r.id,ko:r.ko,braak:r.braak,w:r.w,to:r.to,xy:r.xy,tau:P.tau[r.id]!==undefined?P.tau[r.id]:r.tau,amy:P.amy};}),
    cognition:100,trust:100,company:company,pendingAria:[],news:[],bubbles:[],bubbleT:8,nextId:1,
    earlyUsed:false,over:null,rand:rand,drug:computeDrug(company,[],[]),
    profile:profile,diff:diff,event:null,fired:{},eventT:10+rand()*8,log:[],ariaCount:0,
    ariaPerm:1,tauPerm:1,rpPerm:1,ariaBuff:{mul:1,until:0},failStreak:0,rival:0,rivalRate:100/DIFF[diff].rival*(.9+.2*rand()),rivalWon:false,scn:SCN[scn]?scn:'std',ph:0};
  var S=SCN[st.scn];st.rpPerm*=S.rp;st.ariaPerm*=S.aria;st.rivalRate*=S.rival;st.costMul=S.cost;st.ph=phaseOf(st);st.lastScore=trialEval(st).score;
  return st;
}
function trialReport(st){var d=st.drug,dv=derive(st);
  if(dv.aria>.03)return {key:'ar',ko:'부작용 위험이 높아요',tip:'투여량을 낮추거나 「천천히 늘려 투여」로 부작용 위험을 줄이세요.'};
  var s=[['up',Math.log10(d.uptake*10+1)/3,'뇌 장벽 통과율이 낮아요','침투 계열을 개발하거나 작용기를 바꿔 보세요.'],['th',dv.theta,'표적에 붙는 힘이 약해요','표적 계열을 개발하거나 하이드록시기·아미노기 작용기를 붙여 보세요.'],['cl',dv.clear/.1,'찌꺼기 제거가 느려요','투여량을 올리거나, 약이 뇌에 오래 머물게 해 보세요(「퍼내는 펌프 피하기」).']].sort(function(a,b){return a[1]-b[1];});
  if(s[0][1]>=.6)return {key:'ok',ko:'약 성능이 균형 잡혔어요',tip:'약은 충분히 좋아요. 투여량을 조절하며 사건에 대비하세요.'};
  return {key:s[0][0],ko:s[0][2],tip:s[0][3]};}
K.TRIAL_RP=10;K.TRIAL_CD=28;K.TRIAL_NEED=.25;K.TRIAL_OK=.6;K.TRIAL_REWARD=2;K.TRIAL_RIVAL=1.02;K.TRIAL_CONSOL=4;
function trialEval(st){var d=st.drug,dv=derive(st),sc=Math.min(Math.log10(d.uptake*10+1)/3,dv.theta,dv.clear/.1);if(dv.aria>.03)sc*=.5;return {rep:trialReport(st),score:sc};}
// 예상과 실제 판정이 어긋나지 않도록 시험 판정은 이 함수 하나만 쓴다. 점수가 좋아도 지난 시험보다 나아진 게 없으면(gain<=0) 통과로 치지 않는다
function trialForecast(st){var ev=trialEval(st),base=st.lastScore||0,gain=(ev.score-base)/Math.max(.001,base);
  return {pass:(ev.score>=K.TRIAL_OK&&gain>0)||gain>=K.TRIAL_NEED,gain:gain,need:K.TRIAL_NEED,first:!st.trials,score:ev.score,rep:ev.rep};}
function trialCost(st){return Math.round(K.TRIAL_RP*(1+.5*(st.trials||0)));}
function trialBlock(st){
  if(!st.owned.length&&!st.groups.length)return '먼저 약을 개발하거나 작용기를 붙여 주세요. 지금 약으로는 시험해도 달라질 게 없어요';
  if(st.week<(st.trialNext||0))return '다음 시험까지 '+Math.ceil(st.trialNext-st.week)+'주 남았어요';
  var c=trialCost(st);if(st.rp<c)return '연구점수가 모자라요 (시험 '+c+')';
  return null;}
function runTrial(st){
  var blk=trialBlock(st);if(blk)return {ok:false,msg:blk};
  var c=trialCost(st),fc=trialForecast(st);
  st.rp-=c;st.trials=(st.trials||0)+1;st.trialNext=st.week+K.TRIAL_CD;
  var ev={score:fc.score,rep:fc.rep},gain=fc.gain,pass=fc.pass;
  var rep={pass:pass,num:st.trials,cost:c,score:ev.score,gain:gain,first:fc.first,need:fc.need,key:ev.rep.key,ko:ev.rep.ko,tip:ev.rep.tip,reward:0};
  if(pass){st.trust=Math.min(100,st.trust+8);rep.reward=c*K.TRIAL_REWARD;st.rp+=rep.reward;st.trialPassed=(st.trialPassed||0)+1;st.rivalRate*=K.TRIAL_RIVAL;st.failStreak=0;if(st.trialFails)st.redesign=1;}else{st.rp+=K.TRIAL_CONSOL;st.trialFails=(st.trialFails||0)+1;st.failStreak=(st.failStreak||0)+1;}
  st.lastScore=Math.max(st.lastScore||0,ev.score);st.lastTrial=rep;
  say(st,'임상 시험 '+rep.num+'차 '+(pass?'통과. 신뢰도 +8, 연구점수 +'+rep.reward+'. 결과가 알려져 경쟁사 투자가 늘었어요':'미통과. '+rep.ko));
  return {ok:true,rep:rep};}
function say(st,t){st.news.unshift(t);if(st.news.length>30)st.news.pop();}
// 같은 선택의 정답은 상황(ΔH, 약물 종류, 장비 포화)에 따라 바뀐다
function isProtein(st,n){return st.drug.type==='ab'&&n.tree==='B';}
function condMult(st,n,cond){
  var prot=isProtein(st,n),m;
  if(cond==='catalyst') m=prot?1.3:1.5;
  else if(prot) m=cond==='cool'?1.4:.5;
  else if(n.dH===0) m=1;
  else m=((n.dH<0)===(cond==='cool'))?1.4:.7;
  if(cond!=='catalyst'&&st.pipeline.filter(function(p){return p&&p.cond===cond;}).length>=2) m*=.75;
  return m;
}
function bestCond(st,n,hasN){var b=null,bm=-1;['cool','heat','catalyst'].forEach(function(k){if(k==='catalyst'&&!hasN)return;var m=condMult(st,n,k);if(m>bm+1e-9){bm=m;b=k;}});return {cond:b,mult:bm};}
function worstCond(st,n){var w=null,wm=9;['cool','heat'].forEach(function(k){var m=condMult(st,n,k);if(m<wm){wm=m;w=k;}});return w;}
function whyWrong(st,n,cond){
  if(cond==='catalyst') return '촉매는 활성화 에너지를 낮춰 속도만 올릴 뿐 평형 위치는 바꾸지 못해요 (아세트산 1개 소모).';
  if(isProtein(st,n)&&cond==='heat') return '항체 같은 단백질은 가열하면 변성되어 활성을 잃어요. 발열인지 흡열인지와 상관없이 저온이 원칙이에요.';
  var busy=st.pipeline.filter(function(p){return p&&p.cond===cond;}).length>=2;
  if(busy) return (cond==='cool'?'냉각기':'가열기')+' 2대가 이미 가동 중이라 용량이 포화됐어요. 다른 조건이나 촉매가 나아요.';
  return n.dH<0?'발열 반응은 가열하면 평형이 반응물 쪽으로 이동해 수율이 떨어져요 (르샤틀리에).':'흡열 반응은 냉각하면 평형이 반응물 쪽으로 이동해 수율이 떨어져요 (르샤틀리에).';
}
function canBuy(st,id){
  var n=NODE[id],co=COMPANIES[st.company],why=[];
  if(st.owned.indexOf(id)>=0) return {ok:false,why:['보유 중']};
  n.req.forEach(function(r){if(!(co.exempt&&co.exempt[id]===r)&&st.owned.indexOf(r)<0)why.push('선행: '+r);});
  if(n.reqAny.length&&!n.reqAny.some(function(r){return st.owned.indexOf(r)>=0;}))why.push('선행(택1): '+n.reqAny.join(' 또는 '));
  n.excl.forEach(function(e){if(st.owned.indexOf(e)>=0)why.push('배타: '+e);});
  st.pipeline.forEach(function(p){if(p&&p.nodeId===id)why.push('합성 중');});
  return {ok:why.length===0,why:why};
}
var SOLV_WHY='에탄올 용매는 항체(단백질)를 변성시켜 합성이 느려져요.';
function buy(st,id,cond,solv){ // 성공 시 true, 실패 시 사유 문자열
  var cb=canBuy(st,id); if(!cb.ok) return cb.why.join(', ');
  var n=NODE[id],c=nodeCost(st,id),inst=n.dH===0;
  var useCat=(!inst&&cond==='catalyst'),useSol=(!inst&&!!solv);
  if(!inst){ if(st.pipeline.indexOf(null)<0) return '파이프라인이 가득 찼어요'; }
  if(st.rp<c.rp) return '연구점수 부족';
  if(useCat&&st.lab.acetic<1) return '촉매에는 아세트산이 필요해요 (실험실에서 합성)';
  if(useSol&&st.lab.ethanol<1) return '용매에는 에탄올이 필요해요 (실험실에서 합성)';
  st.rp-=c.rp; if(useCat)st.lab.acetic--; if(useSol)st.lab.ethanol--;
  if(inst){complete(st,id);return true;}
  var solvAb=useSol&&st.drug.type==='ab',mult=condMult(st,n,cond)*(useSol?(solvAb?.6:1.3):1),good=condMult(st,n,cond)>=bestCond(st,n,false).mult-1e-9; // 촉매는 항상 허용(빠름), 온도 선택만 정오 판정
  st.pipeline[st.pipeline.indexOf(null)]={nodeId:id,cond:cond,progress:0,total:c.rp*K.SYNTH_SEC_PER_RP/mult,mult:mult,paid:{rp:c.rp,atoms:{}}};
  if(good&&n.dH!==0){var bonus=Math.round(c.rp*.2);st.rp+=bonus;say(st,solvAb?'온도 선택은 알맞아 연구점수 +'+bonus:'알맞은 조건, 수율이 좋아 연구점수 +'+bonus);}
  if(solvAb)say(st,SOLV_WHY);
  if(n.dH!==0) st.log.push({week:st.week,kind:'chem',title:id+' '+n.name,pick:({cool:'냉각',heat:'가열',catalyst:'촉매'})[cond],good:good,why:good?(solvAb?SOLV_WHY:''):whyWrong(st,n,cond)});
  if(!good) say(st,'수율 저하 · '+id+': '+whyWrong(st,n,cond));
  return true;
}
function cancel(st,slot){
  var p=st.pipeline[slot]; if(!p) return;
  st.rp+=p.paid.rp*.5; for(var a in p.paid.atoms) if(a!=='rp') st.atoms[a]=Math.min(K.ATOM_CAP,st.atoms[a]+Math.floor(p.paid.atoms[a]*.5));
  st.pipeline[slot]=null; say(st,'합성 취소, 투입 자원의 50% 회수');
}
function complete(st,id){
  st.owned.push(id); var n=NODE[id];
  if(id==='C6') st.rival=Math.max(0,st.rival-8);
  if(id==='C3'){var b=braakNow(st);st.regions.forEach(function(r){if(r.braak===b&&r.tau>K.TAU_THRESHOLD)r.tau*=.6;});}
  COMBOS.forEach(function(c){if(st.combos.indexOf(c.id)<0&&c.req.every(function(r){return st.owned.indexOf(r)>=0;})){st.combos.push(c.id);st.lastCombo=c;say(st,'조합 해금 '+c.name);}});
  st.drug=computeDrug(st.company,st.owned,st.combos,st.groups);
  say(st,id+' 개발 완료');
}
function useEarly(st){
  if(st.combos.indexOf('X4')<0||st.earlyUsed) return false;
  var b=braakNow(st); st.regions.forEach(function(r){if(r.braak===b)r.tau=Math.min(r.tau,K.TAU_THRESHOLD*.8);});
  st.earlyUsed=true; say(st,'조기 개입: Braak '+b+'단계 진행을 되돌렸어요'); return true;
}
K.RIVAL_BUB=3;K.RIVAL_BUB_P=.3;K.RIVAL_BUB_TTL=6;
function collectBubble(st,id){var i=st.bubbles.findIndex(function(b){return b.id===id;});if(i<0)return;var b=st.bubbles.splice(i,1)[0];if(b.rv){st.rival=Math.max(0,st.rival-K.RIVAL_BUB);say(st,'경쟁사 임상 지연 정보를 잡았어요. 경쟁사 진행 -'+K.RIVAL_BUB+'%');}else st.rp+=K.BUBBLE_RP;}
function ariaHit(st){
  var d=st.drug,f=d.flags,dmgK=d.trustDmg*(f.autoReduce?.5:1); st.ariaCount++;
  if(st.rand()<.7){
    if(f.mri){st.trust-=15*dmgK;say(st,'뇌 부종(부작용)을 MRI로 일찍 찾았어요. 용량을 조정해야 해요');}
    else{st.pendingAria.push({due:st.week+13,dmg:15*dmgK});say(st,'환자 일부에서 이상 소견 의심… (MRI 없음, 원인 불명)');}
  }else{st.trust-=8*dmgK;say(st,'뇌 미세출혈(부작용) 보고');}
  if(f.autoReduce) st.dose=Math.max(1,st.dose*.8);
}
function resolveEvent(st,i){
  var ev=EVENTS.filter(function(e){return e.id===st.event.id;})[0],b=st.event.best,why=ev.why(st,b);
  var t=ev.act(st,i);st.trust=Math.min(100,st.trust);
  st.log.push({week:st.week,kind:'event',title:ev.title,pick:ev.ch[i].l,best:ev.ch[b].l,good:i===b,why:i===b?'':why});
  if(i===b){st.rp+=10;t+=' (적절한 판단, 연구점수 +10)';}
  say(st,ev.title+', '+t); st.event=null;
}
function step(st,dt){
  if(st.over||st.event) return;
  st.week+=dt; var dv=derive(st),d=st.drug;
  st.rp+=dv.rpRate*dt;
  st.atomAcc+=K.ATOM_RATE*dt;
  while(st.atomAcc>=1){st.atomAcc-=1;var r=st.rand(),acc=0,pick='N';for(var a in K.ATOM_W){acc+=K.ATOM_W[a];if(r<acc){pick=a;break;}}if(st.atoms[pick]<K.ATOM_CAP)st.atoms[pick]++;}
  st.bubbles=st.bubbles.filter(function(b){b.ttl-=dt;return b.ttl>0;});
  st.bubbleT-=dt; if(st.bubbleT<=0){var rvB=st.rival>=20&&!st.rivalWon&&st.rand()<K.RIVAL_BUB_P; // 연구점수 거품은 K.BUBBLES가 켜져 있을 때만, 경쟁사 거품은 항상
    if(rvB||K.BUBBLES){var rg=st.regions[Math.floor(st.rand()*8)];st.bubbles.push({id:st.nextId++,x:rg.xy[0]+(st.rand()-.5)*50,y:rg.xy[1]+(st.rand()-.5)*40,ttl:rvB?K.RIVAL_BUB_TTL:K.BUBBLE_TTL,rv:rvB});if(rvB)say(st,'경쟁사 소식이 떴어요. 뇌 지도의 파란 거품을 누르면 경쟁사 진행이 '+K.RIVAL_BUB+'% 줄어요');}
    st.bubbleT=K.BUBBLE_EVERY[0]+st.rand()*(K.BUBBLE_EVERY[1]-K.BUBBLE_EVERY[0]);}
  for(var i=0;i<3;i++){var p=st.pipeline[i];if(p){p.progress+=dt/p.total;if(p.progress>=1){st.pipeline[i]=null;complete(st,p.nodeId);d=st.drug;}}}
  var dt0=st.regions.map(function(){return 0;});
  // 아밀로이드가 먼저 깔린 영역일수록 타우가 잘 번진다 (아밀로이드가 먼저, 타우가 나중)
  st.regions.forEach(function(ri){if(ri.tau>K.TAU_THRESHOLD)ri.to.forEach(function(t){var j=st.regions.findIndex(function(x){return x.id===t;});dt0[j]+=dv.tauSpread*ri.tau*(.35+.65*st.regions[j].amy/100);});});
  st.rival=Math.min(100,st.rival+st.rivalRate*dt);
  st.rn=st.rn||{};[25,50,75,95].forEach(function(t){if(st.rival>=t&&!st.rn[t]){st.rn[t]=1;say(st,'경쟁사 약물 임상 '+t+'% 진행'+(t>=95?', 곧 허가를 신청해요':''));}});
  if(st.rival>=100&&!st.rivalWon){st.rivalWon=true;say(st,'경쟁사 약물이 먼저 승인됐어요. 최고 등급은 B예요. 연구점수가 15% 덜 들어와요.');}
  st.rg=st.rg||{};st.regions.forEach(function(r){[[50,'기능이 절반으로 떨어졌어요'],[95,'기능을 잃었어요']].forEach(function(t){var k=r.id+t[0];if(r.tau>=t[0]&&!st.rg[k]){st.rg[k]=1;say(st,r.ko+' '+t[1]+' (타우 '+t[0]+')');}});});
  var ph=phaseOf(st);if(ph>st.ph){st.ph=ph;say(st,['','타우가 퍼지기 시작했어요. 20을 넘은 영역이 생겼어요.','타우가 여러 영역으로 퍼졌어요. 항타우 약을 서두르세요.','위기예요. 타우가 5곳 이상으로 퍼졌어요.'][ph]);}
  st.waves=st.waves||[];if(st.waves.length<WAVE_WEEKS.length&&st.week>=WAVE_WEEKS[st.waves.length]){var wv=WAVES[Math.floor(st.rand()*WAVES.length)];st.waves.push(wv.id);wv.fx(st);say(st,wv.ko+'. '+wv.d+'.');}
  st.eventT-=dt;
  if(st.eventT<=0){var el=EVENTS.filter(function(e){return !st.fired[e.id]&&st.week>=e.min&&st.week<=e.max&&e.ok(st);});
    if(el.length){var e=el[Math.floor(st.rand()*el.length)];st.fired[e.id]=1;st.event={id:e.id,best:e.best(st)};st.eventT=K.EVENT_GAP[0]+st.rand()*(K.EVENT_GAP[1]-K.EVENT_GAP[0]);}else st.eventT=4;}
  st.regions.forEach(function(rj,j){rj.tau=Math.min(100,rj.tau+dt0[j]*(1-rj.tau/100)*dt);
    rj.amy=Math.max(0,Math.min(100,rj.amy+(K.AMY_GROWTH*100*(1-rj.amy/100)-dv.clear*rj.amy)*dt));});
  var sum=0;st.regions.forEach(function(r){sum+=r.w*r.tau;}); st.cognition-=K.COG_K*sum*dt;
  var pm=1-Math.pow(1-Math.min(.999,dv.aria),K.COHORT); // 월간, 환자군 K.COHORT명
  if(st.rand()<pm/4.33*dt) ariaHit(st);
  st.pendingAria=st.pendingAria.filter(function(a){if(st.week>=a.due){st.trust-=a.dmg;say(st,'늦게 나타난 뇌 부종(부작용) 증상, 신뢰도 하락');return false;}return true;});
  var amy=st.regions.reduce(function(s,r){return s+r.amy;},0)/8;
  if(st.regions[7].tau>K.LOSE_TAU) st.over={win:false,why:'타우가 감각운동피질에 닿았어요'};
  else if(st.trust<=0) st.over={win:false,why:'신뢰도 0, 임상 중단'};
  else if(st.cognition<25) st.over={win:false,why:'인지 기능 25% 미만'};
  else if(st.week>=K.TOTAL_WEEKS){
    if(st.cognition>=K.GRADE.WIN_COG&&amy<K.GRADE.WIN_AMY){var g=(st.cognition>=K.GRADE.S_COG&&st.trust>=K.GRADE.S_TRUST&&st.combos.indexOf('X5')>=0)?'S':st.cognition>=K.GRADE.A_COG?'A':'B';if(st.rivalWon&&g!=='B')g='B';st.over={win:true,grade:g,why:'36개월 완주'};}
    else st.over={win:false,why:'36개월이 끝났지만 목표(인지 기능 50% 이상, 아밀로이드 20 미만)에 못 미쳤어요'};
  }
  if(st.over){st.over.amy=amy;st.over.cognition=st.cognition;st.over.trust=st.trust;st.over.week=st.week;}
}
// strategy: {company, order:[ids], cond:'right'|'wrong'|'catalyst', dose:function(drug,state)}
function simulate(S,seed){
  var st=newState(S.company||'antibody_house',seed,S.diff||'normal',S.profile),idx=0,tr={n:0,pass:0,net:0,earn:0,inc:0,mark:0};
  while(!st.over){
    if(st.event){resolveEvent(st,S.event==='wrong'?(st.event.best+1)%EVENTS.filter(function(e){return e.id===st.event.id;})[0].ch.length:st.event.best);continue;}
    if(S.dose) st.dose=S.dose(st.drug,st);
    if(idx<S.order.length){var id=S.order[idx],n=NODE[id];
      var cond=S.cond==='wrong'?worstCond(st,n):S.cond==='catalyst'?'catalyst':bestCond(st,n,false).cond;
      if(canBuy(st,id).ok&&buy(st,id,cond)===true) idx++;}
    st.bubbles.forEach(function(b){if(st.rand()<.8)collectBubble(st,b.id);});
    // 임상 시험 정책: smart는 새 노드나 작용기가 생겼을 때만, spam은 쿨다운마다
    var prog=st.owned.length+st.groups.length;
    if((S.trial==='spam'||(S.trial==='smart'&&prog>tr.mark))&&st.week>=(st.trialNext||0)&&st.rp>=trialCost(st)){
      var rp0=st.rp,r=runTrial(st);if(r.ok){tr.n++;tr.mark=prog;tr.net+=st.rp-rp0;tr.earn+=st.rp-rp0+r.rep.cost;if(r.rep.pass)tr.pass++;}}
    tr.inc+=derive(st).rpRate*.1;
    step(st,.1);
  }
  st.over.trials=tr.n;st.over.trialPass=tr.pass;st.over.trialNet=tr.net;st.over.trialEarn=tr.earn;st.over.income=tr.inc;
  return st.over;
}
// ===================== ENGINE END =====================
