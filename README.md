# NEURO INC.

알츠하이머를 막는 약을 설계하는 전략 게임이에요. 과학 배경지식이 없는 학생도 한 판을 끝까지 할 수 있게 만들었어요.

주소: https://jaeho9158.github.io/neuro-inc/

## 하는 법

**목표** 3년 안에 인지 기능(기억하고 판단하는 힘)을 50% 이상으로 지키고, 아밀로이드를 20 미만으로 낮춰요.

**지는 경우** 타우가 맨 위 감각운동피질에 닿거나, 신뢰도가 0이 되거나, 인지 기능이 25% 미만으로 떨어지면 져요. 경쟁사가 먼저 승인을 받으면 최고 등급이 B로 내려가고 연구점수가 15% 덜 들어와요.

**한 판의 흐름**
- 개발: 연구점수로 약 개발 트리의 항목을 개발해요. 항목마다 효과와 대가가 있어요.
- 합성 조건: 개발할 때 냉각, 가열, 촉매 중에서 조건을 골라요. 알맞은 조건이면 빨리 끝나고 연구점수를 보너스로 받아요.
- 실험실: 시약을 주문해 화합물을 합성하고, 작용기로 약에 붙여 성질을 바꿔요. 처음 합성하는 화합물은 구조식을 보고 이름을 맞혀요.
- 임상 시험: 지난 시험보다 눈에 띄게 나아졌을 때 통과해요. 통과하면 신뢰도와 연구점수를 받지만 경쟁사 속도도 조금 늘어요. 시험은 28주에 한 번만 할 수 있어요.
- 사건: 판 중간에 학회, 규제, 언론 같은 사건이 나와요. 선택에 따라 연구점수와 신뢰도가 달라져요.

**조작**
- 마우스나 터치: 버튼과 동그라미를 눌러요.
- 스페이스: 시작하고, 멈추고, 다시 이어가요.
- Esc: 열린 창을 닫아요. 사건 카드와 끝 화면은 닫지 않아요.
- 1과 2: 게임 속도를 바꿔요.

## 화학 원리와 게임 규칙

| 원리 | 성립 조건 | 게임에서 쓰는 방식 |
|---|---|---|
| 르샤틀리에 원리 | 평형에 있는 반응에 온도를 바꾸면 평형이 이동해요. 발열 반응은 식히면, 흡열 반응은 데우면 생성물 쪽으로 가요. | 발열 항목은 냉각이, 흡열 항목은 가열이 알맞은 조건이에요(합성 속도 1.4배, 틀리면 0.7배). 같은 장비가 2대 이상 돌고 있으면 포화되어 0.75배예요. |
| 단백질 변성 | 단백질은 열이나 용매에 구조가 망가져 활성을 잃어요. | 항체 약의 ‘표적’ 계열(단백질 부분) 항목은 가열하면 0.5배로 느려지고, 냉각이 알맞아요. 에탄올 용매도 항체에는 40% 느려지게 해요. |
| 촉매 | 촉매는 활성화 에너지를 낮춰 반응 속도만 올려요. 평형 위치는 바꾸지 못하고, 실제로는 반응 뒤에도 그대로 남아요. | 촉매는 합성을 빠르게 해요(단백질 부분 1.3배, 그 밖의 단계 1.5배). 게임 규칙상 아세트산 1개를 쓰면 없어져요. 실제와 달라요. |
| 작용기와 약의 성질 | 분자에 붙은 작용기가 극성, 결합력, 안정성을 바꿔요. | 하이드록시기(-OH)는 표적 결합을 높이고, 카복실기(-COOH)는 결합을 높이는 대신 부작용이 조금 늘고, 아미노기(-NH2)는 결합이 아주 세지만 뇌 장벽 통과가 나빠져요. 아마이드기(-CONH2)는 약이 오래 버텨요. 작용기를 조합했을 때의 효과는 게임 규칙이고 실제 약의 수치가 아니에요. |
| 분자식과 구조식 | 같은 분자식이라도 원자가 이어진 모양(구조식)이 다르면 다른 물질이에요. | 처음 합성하는 화합물의 구조식을 보고 이름을 맞혀요. 맞히면 연구점수 6, 틀리면 2를 받아요. |

## 파일 구성과 빌드, 테스트

- `_head.html`: 스타일과 화면 뼈대
- `_engine.js`: 규칙, 데이터, 문구
- `_sfx.js`: 효과음 데이터예요. `make-sfx.js` 가 만들어요. 직접 고치지 않아요.
- `_ui.js`: 화면과 조작
- `make-sfx.js`: 고른 효과음의 크기를 맞추고 `_sfx.js` 로 묶어요. ffmpeg 이 있어야 해요.
- `sfx-src/`: 고른 효과음 원본 12개와 라이선스 글
- `build.js`: `_head.html`, `_engine.js`, `_sfx.js`, `_ui.js` 네 파일을 합쳐 한 개의 html 파일로 만들어요.
- `balance.test.js`: 밸런스와 규칙 테스트예요.
- `check-copy.js`: 문구 규칙 검사예요.
- `og.html`, `og.png`: 공유할 때 보이는 그림(가로 1200, 세로 630)과 그 원본이에요.
- `neuro-inc.html`: `_head.html`, `_engine.js`, `_sfx.js`, `_ui.js` 를 합친 결과예요. 직접 고치지 않아요.

```
node build.js          # neuro-inc.html 을 만들어요
node balance.test.js   # 밸런스와 규칙 테스트, 마지막 줄이 ALL PASS 여야 해요
node check-copy.js     # 문구 규칙 검사, 마지막 줄이 OK 여야 해요
node make-sfx.js    # 효과음을 바꿨을 때만: _sfx.js 를 다시 만들어요 (ffmpeg 필요)
```

별도 패키지 없이 Node.js만 있으면 돼요. 효과음을 다시 만들 때만 ffmpeg 이 필요해요.

## 배포 방법

`node build.js index.html` 로 `index.html` 을 만들고, 이 파일과 `og.png` 를 저장소 맨 위에 두면 GitHub Pages에서 바로 열려요.

## 출처

- 글꼴: Noto Sans KR (SIL Open Font License 1.1, Google Fonts에서 불러와요)
- 효과음: Kenney(kenney.nl)의 Interface Sounds와 Music Jingles (Creative Commons Zero). 고른 파일과 크기 목표는 make-sfx.js 에 있어요.
  - https://kenney.nl/assets/interface-sounds
  - https://kenney.nl/assets/music-jingles
- 게임의 틀은 Plague Inc.(Ndemic Creations)를 참고했어요. 이 게임은 그 회사와 관련이 없어요.
- 실제 사례의 출처:
  - https://www.alz.org/news/2025/fda-action-approving-leqembi-subcutaneous-maintenance-dosing
  - https://www.alz.org/news/2026/alzheimers-association-welcomes-fda-approval-leqembi-subcutaneous-starter-dose
  - https://m.dailypharm.com/user/news/343319
  - https://www.roche.com/media/releases/med-cor-2025-07-28.htm
  - https://www.neurologylive.com/view/latest-brainshuttle-ad-study-interim-data-support-continued-trontinemab-development-alzheimers
  - https://www.fda.gov/drugs/drug-safety-communications/fda-recommend-additional-earlier-mri-monitoring-patients-alzheimers-disease-taking-leqembi-lecanemab
  - https://www.alz.org/media/Documents/lecanemab-toolkit-apoe.pdf
  - https://www.aan.com/MSA/Public/Events/AbstractDetails/65030
  - https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12413699/
  - https://www.alz.org/alz-pro/hub/care-pathway/blood-based-biomarkers-guideline
  - https://www.fda.gov/news-events/press-announcements/fda-clears-first-blood-test-used-diagnosing-alzheimers-disease

## 안내

게임 속 수치는 교육용으로 단순화한 값이에요. 실제 치료 판단에 쓰면 안 돼요. 아픈 사람과 가족은 의사와 상의해 주세요.
