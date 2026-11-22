// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-17
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (game.js); the tweak panel, an add-on, writes them back here.
// tiers·gear·models는 표(슬라이더 없음): 시험 25개(3막), 장비 25종, AI 모델 15단계의 숫자와 이름도 전부 여기서 고친다.
window.CONFIG = {
  seed: 1, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },

  // ---- 시험 ----
  pass_mark: { value: 0.6, min: 0.3, max: 1, step: 0.05 },        // 합격선: 정답 비율
  time_scale: { value: 1, min: 0.5, max: 2, step: 0.05 },          // 모든 시험 시간 배율
  time_bonus: { value: 0.5, min: 0, max: 2, step: 0.05 },          // 남은 시간 비율 x 이 값만큼 보상 추가
  reward_scale: { value: 1, min: 0.1, max: 10, step: 0.1 },        // 모든 보상 배율
  fee_scale: { value: 1, min: 0, max: 3, step: 0.05 },             // 모든 응시료 배율 (0이면 무료)
  fee_ratio: { value: 0.22, min: 0, max: 1, step: 0.01 },          // 응시료 = 만점 상금 x 이 비율
  jackpot_mult: { value: 3, min: 1, max: 10, step: 0.5 },          // 만점(수석 합격) 보상 배율

  // ---- 스캔과 AI ----
  scan_time: { value: 2.0, min: 0.3, max: 4, step: 0.1 },          // 장비 없을 때 스캔 시간(초)
  lens_bonus: { value: 0.22, min: 0, max: 0.6, step: 0.01 },       // 렌즈 단계당 스캔 속도 +
  ai_base: { value: 0.97, min: 0.5, max: 1, step: 0.01 },          // 시험 난도 = AI 모델 단계일 때 정답률
  ai_drop: { value: 0.1, min: 0, max: 0.3, step: 0.01 },           // 난도가 모델보다 1 높을 때마다 정답률 -
  ai_floor: { value: 0.35, min: 0.25, max: 0.9, step: 0.01 },      // AI 정답률 최저치

  // ---- 감독관과 의심도 ----
  sus_scale: { value: 1, min: 0.2, max: 3, step: 0.05 },           // 의심도 증가 배율 (시험별 sus에 곱함)
  sus_decay: { value: 0.06, min: 0, max: 1, step: 0.01 },          // 스캔 안 할 때 초당 의심도 감소
  tell_ratio: { value: 0.4, min: 0, max: 1, step: 0.05 },         // 낌새 중 스캔 = 주시 중 스캔의 몇 배
  proctor_speed: { value: 1, min: 0.3, max: 3, step: 0.05 },       // 감독관 걸음 속도 배율
  proctor_pace: { value: 0.8, min: 0.3, max: 3, step: 0.05 },        // 서 있기·걷기 시간 배율 (작을수록 자주 돌아봄)
  look_time: { value: 0.16, min: 0.05, max: 0.6, step: 0.01 },     // 고개를 돌리는 데 걸리는 시간(초)
  footstep_gap: { value: 0.42, min: 0.2, max: 1, step: 0.02 },     // 감독관 발소리 간격(초)
  cctv_period: { value: 7, min: 2, max: 20, step: 0.5 },           // CCTV 한 번 훑는 시간(초)
  cctv_rate: { value: 0.7, min: 0, max: 3, step: 0.05 },           // CCTV에 찍힐 때 스캔 = 주시의 몇 배
  pulse_gap: { value: 8.5, min: 3, max: 20, step: 0.5 },           // 탐지 전파·드론·화면 검사 평균 간격(초)
  pulse_rate: { value: 1.4, min: 0, max: 5, step: 0.1 },           // 그때 스캔하면 초당 의심도

  scan_drop: { value: 10, min: 0, max: 10, step: 0.1 },            // 스캔하다 손을 떼면 초당 날아가는 진행도 (10이면 바로 처음부터, 0이면 그대로 이어서)
  peek_gap_min: { value: 10, min: 3, max: 40, step: 0.5 },         // 감독관이 책상 밑에서 올려다보는 간격(초)
  peek_gap_max: { value: 16, min: 3, max: 60, step: 0.5 },
  peek_sneak: { value: 1.1, min: 0.3, max: 3, step: 0.1 },         // 사라져서 책상 밑으로 숨어드는 시간(초): 이때 삐걱 소리가 난다
  peek_stare: { value: 1.6, min: 0.3, max: 4, step: 0.1 },         // 올려다보는 시간(초): 이때 스캔하면 바로 적발
  heat_perfect: { value: 0.34, min: 0, max: 1, step: 0.01 },       // 만점 합격 한 번에 쌓이는 전수조사 의심
  heat_high: { value: 0.15, min: 0, max: 1, step: 0.01 },          // 90점 이상 합격에 쌓이는 의심
  heat_cool: { value: 0.1, min: 0, max: 1, step: 0.01 },           // 평범한 점수로 합격하거나 떨어지면 식는 의심
  heat_after: { value: 0.5, min: 0, max: 0.95, step: 0.05 },       // 전수조사에 걸려 합격이 취소된 뒤 남는 의심
  black_mult: { value: 4, min: 0.5, max: 30, step: 0.5 },          // 브로커 협박 금액 = 값 x 방금 합격한 시험의 문제당 상금
  probe_time: { value: 55, min: 20, max: 120, step: 5 },          // 재시험 5문제에 주는 시간(초)
  lamp_from: { value: 5, min: 0, max: 24, step: 1 },                // 몇 번째 시험부터 만점이 의심받는가 (0부터 셈: 5 = 여섯 번째 7급 공무원). 그 전 시험은 만점이어도 빨간 등이 안 켜진다
  black_heat: { value: 0.5, min: 0, max: 1, step: 0.05 },          // 협박을 무시해 제보당하면 쌓이는 의심

  // ---- 시험마다 다른 장치 ----
  metal_sus: { value: 0.55, min: 0, max: 0.9, step: 0.05 },        // 수능 입실 금속탐지기: 시작 의심도
  glass_sus: { value: 0.5, min: 0, max: 0.9, step: 0.05 },         // 가오카오 입실 안경 검사: 시작 의심도
  visit_out_min: { value: 8, min: 2, max: 30, step: 0.5 },         // 교수·선생님이 교실 밖에 있는 시간(초)
  visit_out_max: { value: 14, min: 2, max: 40, step: 0.5 },
  visit_in_min: { value: 6, min: 2, max: 30, step: 0.5 },          // 교수가 들어와 머무는 시간(초)
  visit_in_max: { value: 10, min: 2, max: 40, step: 0.5 },
  listen_time: { value: 2.2, min: 0.5, max: 6, step: 0.1 },        // 이어폰 AI가 듣기 문항을 받아쓰는 시간(초)
  webcam_off_min: { value: 3, min: 0.5, max: 10, step: 0.5 },      // 웹캠 감독이 안 보는 시간(초)
  webcam_off_max: { value: 6, min: 1, max: 15, step: 0.5 },
  webcam_tell: { value: 0.8, min: 0.2, max: 2, step: 0.05 },       // 웹캠 불이 깜빡이는 예고(초)
  webcam_live_min: { value: 1.8, min: 0.5, max: 6, step: 0.1 },    // 웹캠 감독이 보는 시간(초)
  webcam_live_max: { value: 3.2, min: 0.5, max: 8, step: 0.1 },
  look_away_rate: { value: 0.5, min: 0, max: 2, step: 0.05 },      // 웹캠이 볼 때 고개를 돌리면 의심 (주시의 몇 배)
  crowd_gap_min: { value: 6, min: 2, max: 20, step: 0.5 },         // 다른 수험생 이벤트 간격(초)
  crowd_gap_max: { value: 10, min: 2, max: 30, step: 0.5 },
  crowd_time: { value: 3.5, min: 1, max: 8, step: 0.25 },          // 감독관이 그쪽에 붙어 있는 시간(초)
  check_gap_min: { value: 9, min: 3, max: 30, step: 0.5 },         // 신분 확인·계산기 검사 간격(초)
  check_gap_max: { value: 15, min: 3, max: 40, step: 0.5 },
  check_time: { value: 2.6, min: 0.5, max: 6, step: 0.1 },         // 내 책상 앞에 서 있는 시간(초)
  check_rate: { value: 2, min: 1, max: 5, step: 0.25 },            // 책상 앞에서 스캔하면 주시의 몇 배
  glow_rate: { value: 0.35, min: 0, max: 2, step: 0.05 },          // 책상 앞에서 AI 답이 렌즈에 떠 있으면 (주시의 몇 배)
  calc_sus: { value: 0.3, min: 0, max: 0.9, step: 0.05 },          // 계산기 검사에 걸리면 오르는 의심도
  long_scan: { value: 1.5, min: 1, max: 3, step: 0.05 },           // LEET 긴 지문: 스캔 시간 배율
  essay_read: { value: 0.9, min: 0.2, max: 3, step: 0.1 },         // 서술형: 모범 답안 한 줄을 읽는 시간(초). 이 동안이 위험하다
  essay_write: { value: 1.1, min: 0.2, max: 3, step: 0.1 },        // 서술형: 읽은 한 줄을 옮겨 쓰는 시간(초). 이 동안은 안전하다
  aiiv_present: { value: 4, min: 0, max: 15, step: 0.5 },          // AI 면접: 상황을 읽어 주는 시간(초). 이 동안은 대본이 아직 없다
  aiiv_think: { value: 8, min: 0, max: 30, step: 0.5 },            // AI 면접: 생각할 시간(초). 대본을 미리 읽어 둘 수 있다
  aiiv_read: { value: 1.2, min: 0.2, max: 3, step: 0.1 },           // AI 면접: 대본 한 줄을 읽는 시간(초). 다섯 줄을 한 번에 읽으면 5초를 넘는다
  gaze_limit: { value: 5, min: 2, max: 10, step: 0.5 },            // AI 면접: 시선이 이만큼(초) 연속으로 벗어나면 그 자리에서 탈락
  gaze_warn: { value: 3, min: 1, max: 10, step: 0.5 },             // AI 면접: 이만큼(초) 벗어나면 경고와 함께 의심 +8%
  gaze_reset: { value: 1, min: 0.2, max: 5, step: 0.1 },           // AI 면접: 카메라를 이만큼(초) 다시 보면 벗어난 시간이 0으로
  speak_read: { value: 0.9, min: 0.2, max: 3, step: 0.1 },         // 면접: 대본 한 줄을 읽는 시간(초). 면접관이 볼 때는 읽을 수 없다
  speak_say: { value: 2.2, min: 0.5, max: 5, step: 0.1 },          // 면접: 한 줄을 말하는 시간(초). 읽어 둔 데까지만 말할 수 있다
  speak_wait: { value: 1.6, min: 0, max: 5, step: 0.1 },           // 면접: 질문이 끝나고 입을 떼기까지(초)
  speak_stam: { value: 2.6, min: 0.5, max: 10, step: 0.1 },        // 면접: 한 문항에서 말이 끊겨도 되는 시간(초). 넘으면 그 문항은 감점
  essay_mem: { value: 5, min: 1, max: 15, step: 0.5 },             // 서술형: 읽은 줄을 기억하는 시간(초). 손을 떼고 있으면 줄어든다
  stairs_time: { value: 10, min: 4, max: 20, step: 1 },             // LEET 쉬는 시간 계단 질주: 뛰는 시간(초)
  stairs_need: { value: 34, min: 10, max: 80, step: 2 },            // 이만큼 계단을 밟으면 머리가 맑아진다 (2교시는 AI 없이도 답이 보인다)
  session_keep: { value: 0.5, min: 0, max: 1, step: 0.05 },        // 교시가 바뀔 때 남는 의심도 비율
  adaptive_drop: { value: 0.15, min: 0, max: 0.5, step: 0.01 },    // SAT 1모듈을 잘 보면 2모듈 AI 정답률 -
  fatigue_step: { value: 0.25, min: 0, max: 1, step: 0.05 },       // USMLE 블록마다 스캔 시간 +
  peripheral: { value: 0.3, min: 0, max: 1, step: 0.05 },          // 세 눈 외계인: 등을 돌려도 보는 비율
  float_wobble: { value: 0.35, min: 0, max: 0.9, step: 0.05 },     // 무중력 시험지: 스캔이 흔들려 느려지는 최대치
  clone_gap: { value: 11, min: 3, max: 40, step: 0.5 },            // 평행우주 감독관이 한 명 더 나오는 간격(초)
  clone_max: { value: 5, min: 1, max: 8, step: 1 },                // 평행우주 감독관 최대 인원
  ai_sus_gain: { value: 0.22, min: 0, max: 1, step: 0.01 },        // 인간 인증: AI 답을 고를 때마다 AI 의심도 +
  ai_sus_drop: { value: 0.12, min: 0, max: 1, step: 0.01 },        // 인간 인증: 직접 고를 때마다 AI 의심도 -
  omega_window: { value: 0.45, min: 0.1, max: 1.5, step: 0.05 },   // Ω: 같은 박자로 스캔하면 들킴 (간격 차이 허용 초)
  omega_jump: { value: 0.3, min: 0, max: 1, step: 0.05 },          // Ω에게 박자를 읽히면 오르는 의심도

  // ---- 장비 효과 ----
  stealth_cut: { value: 0.15, min: 0, max: 0.4, step: 0.01 },      // 스텔스 코팅 단계당 의심도 증가 x(1-값), 입실 검사도 줄임
  predict_bonus: { value: 0.12, min: 0, max: 0.5, step: 0.01 },    // 시선 예측 단계당 낌새 시간 +초
  coach_bonus: { value: 0.25, min: 0, max: 1, step: 0.05 },        // 면접 코치 단계당 합격 보상 +배율
  watch_bonus: { value: 5, min: 0, max: 15, step: 0.5 },           // 스마트워치 단계당 시험 시간 +초
  earbud_threshold: { value: 85, min: 40, max: 100, step: 1 },     // 이어폰 1단계: 이 신뢰도(%) 이상이면 자동 제출
  earbud_step: { value: 5, min: 0, max: 15, step: 1 },             // 이어폰 단계당 자동 제출 기준 -%
  earbud_delay: { value: 0.35, min: 0, max: 2, step: 0.05 },       // 이어폰이 답을 대신 내기까지(초)
  autoscan_delay: { value: 0.35, min: 0, max: 1.5, step: 0.05 },   // 자동 스캔 칩 1단계의 반응 지연(초), 단계마다 절반
  jam_cut: { value: 0.6, min: 0, max: 1, step: 0.05 },             // 재머 1단계가 줄이는 비율 (최고 단계면 완전 차단)
  gear_cut: { value: 0.5, min: 0, max: 1, step: 0.05 },            // 시험 전용 장비 단계당 그 장치 효과 감소 (2단계면 무력화)
  taste_bonus: { value: 0.12, min: 0, max: 0.4, step: 0.01 },      // AI 미각 센서 단계당 테이스팅 정답률 +
  taste_need: { value: 0.25, min: 0, max: 0.6, step: 0.01 },       // 미각 센서가 없을 때 테이스팅 AI 정답률 -
  gaze_cut: { value: 0.25, min: 0, max: 0.5, step: 0.01 },         // 시선 보정 렌즈 단계당 마주 보는 시험 의심도 -
  break_time: { value: 2.5, min: 0.5, max: 8, step: 0.5 },         // 교시·모듈·블록 사이 쉬는 시간(초)
  zoom_time: { value: 0.8, min: 0.1, max: 1.5, step: 0.05 },      // 고시원에서 노트북·일정표·폰으로 다가가는 시간(초)
  candle_bonus: { value: 0.4, min: 0, max: 1.5, step: 0.05 },      // 촛불 감지기 단계당 저승사자 낌새 +초

  sticker_slow: { value: 1.4, min: 1, max: 3, step: 0.05 },        // 단추 스티커: 단추 카메라(안경 전 단계)면 스캔 시간 배율
  emp_wipe: { value: 1, min: 0, max: 1, step: 0.1 },                // EMP가 터지면 진행 중인 스캔이 날아가는 비율
  glass_level: { value: 3, min: 1, max: 7, step: 1 },              // 촬영·표시 장비가 이 단계부터 AI 안경(시험지 위 AR). 그 전에는 소매 속 액정
  down_keep: { value: 0.6, min: 0.1, max: 3, step: 0.1 },          // 손을 뗀 뒤 고개를 숙이고 있는 시간(초)
  answer_keep: { value: 3, min: 0.5, max: 8, step: 0.5 },          // AI 답이 뜬 뒤 마킹을 기다리며 숙이고 있는 시간(초)
  broker_markup: { value: 1.5, min: 1, max: 5, step: 0.1 },        // 텔레그램 브로커 웃돈 배율

  // ---- 경제 ----
  cost_scale: { value: 1, min: 0.1, max: 10, step: 0.1 },          // 모든 장비 가격 배율
  model_cost: { value: 3, min: 0.5, max: 20, step: 0.5 },          // AI 모델 구독료 = 출시 다음 시험의 문제당 상금 x 이 값
  bot_rate: { value: 0.004, min: 0, max: 0.05, step: 0.001 },      // 대리 응시 1명 초당 수입 = 값 x 통과한 최고 시험의 문제당 상금
  bot_cost: { value: 6, min: 1, max: 50, step: 0.5 },              // 대리 응시 첫 가격 = 값 x 대리 응시가 열리는 시험의 문제당 상금 (고정)
  bot_grow: { value: 2.5, min: 1.01, max: 4, step: 0.01 },        // 대리 응시 한 명 늘 때마다 가격 배수
  away_cap: { value: 3600, min: 0, max: 28800, step: 300 },        // 자리 비움 보상 최대 시간(초)
  away_rate: { value: 0.5, min: 0, max: 1, step: 0.05 },           // 자리 비움 동안 대리 응시 효율
  count_speed: { value: 6, min: 1, max: 20, step: 0.5 },           // 숫자 카운트업 속도

  hud_style: 'viewfinder', // 시험 화면 HUD: viewfinder(몰래카메라 뷰파인더) | classic
  sub_style: 'film', // 방송 자막: bar(검은 띠, 지금 사이트) | film(띠 없이 테두리 글자)
  hud_font: 'system', // HUD 글꼴: pretendard(차분한 고딕) | dohyeon(도현체) | system
  room_assets: 'box', // 시험장 가구·사람: box(코드로 쌓은 상자) | gen (assets/room1.js의 생성 모델)
  look: 'psx', // 화면 느낌: psx(지금) | pixel(정해진 색 + 먹선, 2D 픽셀 그림처럼)
  title_font: 'default', // 타이틀 글자: default | reatic | reaticwide | reaticnarrow (assets/title-art.js의 그림)
  hub_props: 'box', // 고시원 소품: box(코드로 쌓은 상자) | gen (assets/의 생성 모델)
  ending_model: 'box', // 엔딩의 내 모습: box(코드로 쌓은 상자) | meshy | hf (assets/의 생성 모델)
  acts: ['국내', '해외', '외계'], // 화면에 보이는 구간 이름 (막이라는 말은 화면에 쓰지 않는다)

  // 시험 25개. act: 막, staff: 감독관(종류·이름), stand: 서 있는 시간 범위(초), walk: 걷는 시간 범위(초), tell: 돌아보는 낌새(초),
  // watch: 나를 쳐다보는 시간(초), speed: 걷는 속도(통로 길이 비율/초), cross: 반대편으로 건너갈 확률, feint: 돌아보다 마는 확률,
  // sus: 쳐다볼 때 스캔하면 초당 의심도, ai: AI가 느끼는 난도(모델 단계와 비교), reward: 문제당 상금(원), fee: 응시료(없으면 계산),
  // sec: cctv·pulse, pulse: 전파 모양(drone 드론, screen 화면 검사), mech: 그 시험만의 장치, parts: 교시·모듈·블록 이름,
  // room: 시험장, layout: table(마주 앉는 면접·테이스팅), device: tablet·laptop·ar, noAuto: AI 감독관이 이어폰·자동 스캔을 막음
  // staff의 visit: drop(밖에 있다가 들어옴) · coffee(있다가 나감), fixed: 앞에 고정
  tiers: [
    // ---- 1막 대한민국 ----
    { id: 'mock', act: 1, name: '고3 6월 모의평가', subject: '국어 영역', gen: 'spell', qn: 5, time: 60, room: 'hs', sec: [], mech: ['tutorial'], fee: 0,
      staff: [{ type: 'homeroom', name: '담임 선생님' }],
      stand: [3.6, 5.2], walk: [1.6, 2.6], tell: 1.3, watch: 1.4, speed: 0.1, cross: 0.1, feint: 0, sus: 0.8, ai: 0, reward: 200, pay: '용돈',
      head: ['2026학년도 6월 고3 전국연합학력평가', '국어 영역'], lines: ['6월 모의평가', '1교시 국어 · 08:40 ~ 10:00'] },
    { id: 'suneung', act: 1, name: '대학수학능력시험', subject: '수학 영역', gen: 'eq', qn: 8, time: 100, room: 'suneung', sec: [], mech: ['metal'],
      staff: [{ type: 'suneung', name: '정감독관' }, { type: 'homeroom', name: '부감독관' }],
      stand: [2.8, 4.2], walk: [1.3, 2.3], tell: 1.0, watch: 1.8, speed: 0.11, cross: 0.18, feint: 0.08, sus: 0.85, ai: 1.2, reward: 720, pay: '장학금',
      news: '수능 만점자가 너무 많다? 교육부 "가방은 복도에, 전자기기는 1교시 전 전부 수거"',
      head: ['2027학년도 대학수학능력시험 문제지', '수학 영역'], lines: ['2027학년도 대학수학능력시험', '2교시 수학 영역 · 10:30 ~ 12:10', '휴대전화 · 스마트기기 반입 금지'] },
    { id: 'transfer', act: 1, name: '대학 편입학 시험', subject: '편입 영어', gen: 'transfer', qn: 6, time: 70, room: 'lecture', sec: [], mech: ['visit'],
      staff: [{ type: 'ta', name: '조교' }, { type: 'prof', name: '교수님', visit: 'drop' }],
      stand: [2.6, 4.0], walk: [1.2, 2.2], tell: 0.95, watch: 1.9, speed: 0.11, cross: 0.2, feint: 0.1, sus: 0.9, ai: 2, reward: 2600, pay: '편입 장학금',
      news: '편입 시험 합격선이 이상하게 올랐다. 수험생 카페 "단기 합격 수기, 믿어도 되나"',
      head: ['2027학년도 일반편입학 필기고사', '영어'], lines: ['일반편입학 필기고사', '휴대폰 OFF · 감독 교수 순시 중'] },
    { id: 'toeic', act: 1, name: '토익(TOEIC)', subject: 'LC + RC', gen: 'toeic', qn: 8, listen: 4, time: 100, room: 'toeic', sec: [], mech: ['listen'],
      staff: [{ type: 'dean', name: '토익 감독관' }],
      stand: [2.4, 3.8], walk: [1.2, 2.0], tell: 0.9, watch: 2.0, speed: 0.12, cross: 0.25, feint: 0.12, sus: 0.95, ai: 2.5, reward: 9300, pay: '어학 장학금',
      head: ['TOEIC 정기시험', 'LISTENING · READING'], lines: ['TOEIC 정기시험', 'LC 방송 중 이동 금지 · 신분증 지참'] },
    { id: 'toefl', act: 1, name: '토플 홈에디션', subject: 'Reading', gen: 'toefl', qn: 6, time: 80, room: 'home', device: 'laptop', sec: [], mech: ['webcam'],
      staff: [{ type: 'webcam', name: '원격 감독관', fixed: true }],
      stand: [3, 6], walk: [1, 1], tell: 0.8, watch: 2.4, speed: 0, cross: 0, feint: 0.1, sus: 1.0, ai: 3.2, reward: 34000, pay: '유학 장학금',
      head: ['TOEFL iBT Home Edition', 'Reading Section'], lines: [] },
    { id: 'civil7', act: 1, name: '7급 공무원 공채', subject: '헌법·상황판단', gen: 'psat', qn: 8, time: 90, room: 'history', sec: [], mech: ['crowd'],
      staff: [{ type: 'dean', name: '감독관' }, { type: 'homeroom', name: '감독관' }],
      stand: [2.2, 3.4], walk: [1.1, 2.0], tell: 0.8, watch: 2.1, speed: 0.12, cross: 0.3, feint: 0.15, sus: 1.0, ai: 3.6, reward: 120000, pay: '첫 월급',
      news: '7급 공채에도 AI 커닝 의혹. 인사처 "시험장에 CCTV를 달겠다"',
      head: ['2027년도 국가공무원 7급 공개경쟁채용', '제1차 시험'], lines: ['국가공무원 7급 공개경쟁채용', '부정행위 시 응시 무효'] },
    { id: 'customs', act: 1, name: '관세사 시험', subject: '관세법·무역영어', gen: 'customs', qn: 10, time: 120, room: 'civil', sec: ['cctv'], mech: [],
      staff: [{ type: 'agent', name: '시험 관리관' }, { type: 'dean', name: '감독관' }],
      stand: [2.2, 3.4], walk: [1.1, 2.0], tell: 0.7, watch: 2.2, speed: 0.13, cross: 0.25, feint: 0.2, sus: 1.1, ai: 4.3, reward: 440000, pay: '첫 수임료',
      news: '관세사 동차 합격자 급증. 정부 "켜진 폰을 찾으려 시험 중 불시에 재난문자를 보내겠다"',
      head: ['제44회 관세사 시험', '관세법개론 · 무역영어'], lines: ['관세사 자격시험', '전자기기 소지 = 부정행위 · CCTV 녹화 중'] },
    { id: 'tax', act: 1, name: '세무사 시험', subject: '회계·세법', gen: 'tax', qn: 8, time: 110, room: 'tax', sec: ['pulse'], pulse: 'alert', mech: [],
      staff: [{ type: 'dean', name: '감독관' }, { type: 'agent', name: '시험 관리관' }, { type: 'homeroom', name: '감독관' }],
      stand: [1.9, 3.0], walk: [1.0, 1.7], tell: 0.62, watch: 2.4, speed: 0.1, cross: 0.3, feint: 0.25, sus: 1.2, ai: 4.8, reward: 1600000, pay: '첫 수임료',
      news: '세무사 수석 합격자, 초소형 카메라 부정행위 의혹. 초소형 카메라 품절 대란 · 정부 "옷 단추마다 스티커를 붙이겠다"',
      head: ['제64회 세무사 시험', '회계학 · 세법학'], lines: ['세무사 자격시험', '시험 중 불시 재난문자 발송'] },
    { id: 'cpa', act: 1, name: '공인회계사 1차 시험', subject: '회계학·세법개론', gen: 'cpa', qn: 10, time: 130, room: 'cpa', sec: ['cctv'], mech: ['idcheck'],
      staff: [{ type: 'dean', name: '감독관' }, { type: 'agent', name: '시험 관리관' }],
      stand: [1.8, 2.9], walk: [1.0, 1.7], tell: 0.6, watch: 2.4, speed: 0.12, cross: 0.3, feint: 0.25, sus: 1.25, ai: 5.2, reward: 5600000, pay: '사이닝 보너스',
      news: '회계사 1차에서도 같은 수법이었다는 진술. 금감원 "책상마다 신분 확인을 돌겠다"',
      head: ['제62회 공인회계사 제1차 시험', '회계학'], lines: ['공인회계사 제1차 시험', '신분 확인 중 · 수험표는 책상 위에'] },
    { id: 'appraiser', act: 1, name: '감정평가사 시험', subject: '감정평가이론·실무', gen: 'appraise', qn: 10, time: 130, room: 'cpa', sec: ['cctv'], mech: ['sticker'],
      staff: [{ type: 'dean', name: '감독관' }, { type: 'agent', name: '시험 관리관' }],
      stand: [1.8, 2.9], walk: [1.0, 1.7], tell: 0.6, watch: 2.4, speed: 0.12, cross: 0.3, feint: 0.25, sus: 1.25, ai: 5.5, reward: 20000000, pay: '첫 감정 수수료',
      news: '"6개월 합격" 수기 논란. 정부, 국가자격시험 전 종목 전수조사 · 시험장에 AI 탐지 전파 도입',
      head: ['제38회 감정평가사 시험', '감정평가이론 · 실무'], lines: ['감정평가사 자격시험', '단추 스티커 부착 · CCTV 녹화 중'] },
    { id: 'leet', act: 1, name: '법학적성시험(LEET)', subject: '언어이해·추리논증', gen: 'logic', qn: 5, parts: ['1교시 언어이해', '2교시 추리논증'], time: 85, room: 'leet', sec: ['cctv', 'pulse'], mech: ['long'],
      staff: [{ type: 'agent', name: '시험 관리관' }, { type: 'suneung', name: '감독관' }],
      stand: [1.8, 3.0], walk: [1.0, 1.8], tell: 0.6, watch: 2.4, speed: 0.13, cross: 0.3, feint: 0.25, sus: 1.3, ai: 5.8, reward: 73000000, pay: '로스쿨 장학금',
      news: 'LEET 만점자 답안 수정 흔적 논란. 법무부 "변호사시험은 AI 감독관이 본다"',
      head: ['2028학년도 법학적성시험 문제지', '추리논증'], lines: ['법학적성시험 (LEET)', '2교시 추리논증 · 긴 지문 주의'] },
    { id: 'mdeet', act: 1, name: '의·치의학교육입문검사(MDEET)', subject: '자연과학추론', gen: 'med', qn: 8, time: 120, room: 'cfa', sec: ['pulse'], mech: ['peek'],
      staff: [{ type: 'dean', name: '감독관' }, { type: 'agent', name: '시험 관리관' }],
      stand: [1.7, 2.8], walk: [1.0, 1.7], tell: 0.55, watch: 2.4, speed: 0.13, cross: 0.3, feint: 0.28, sus: 1.35, ai: 6.1, reward: 260000000, pay: '의전원 장학금',
      news: 'MDEET 수석도 의혹. 감독관 지침 개정 "의심되면 책상 밑에서 올려다보라"',
      head: ['2028학년도 의·치의학교육입문검사', '자연과학추론'], lines: ['MDEET', '감독관이 어디서든 지켜봅니다'] },
    { id: 'bar', act: 1, name: '변호사시험', subject: '공법·형사법·민사법', gen: 'law', qn: 6, essay: false, parts: ['1교시 공법', '2교시 형사법', '3교시 민사법'], time: 80, room: 'bar',
      sec: ['cctv', 'pulse'], mech: ['sessions', 'peek'], noAuto: true, boss: true,
      staff: [{ type: 'robot', name: 'AI 감독관' }, { type: 'agent', name: '시험 관리관' }],
      stand: [1.4, 2.4], walk: [0.8, 1.4], tell: 0.5, watch: 2.6, speed: 0.12, cross: 0.35, feint: 0.3, sus: 1.4, ai: 6.2, reward: 950000000, pay: '첫 연봉',
      news: 'K-커닝, 세계로. 각국 시험 당국이 한국발 수법에 비상',
      head: ['제17회 변호사시험', '선택형'], lines: ['변호사시험', 'AI 감독 시스템 가동 중'] },
    // ---- 2막 글로벌 ----
    { id: 'sat', act: 2, name: '미국 SAT', subject: 'Reading & Math', gen: 'sat', qn: 6, parts: ['Module 1', 'Module 2'], time: 70, room: 'usclass', device: 'tablet', sec: [], mech: ['adaptive', 'visit'],
      staff: [{ type: 'teacher', name: '감독 선생님', visit: 'coffee' }],
      stand: [2.0, 3.2], walk: [1.0, 1.8], tell: 0.65, watch: 2.3, speed: 0.12, cross: 0.25, feint: 0.2, sus: 1.2, ai: 6.6, reward: 3400000000, pay: '미국 대학 장학금',
      head: ['SAT · Bluebook', 'Reading and Writing / Math'], lines: ['SAT Test Day', 'Phones in bags · No smart glasses'] },
    { id: 'gaokao', act: 2, name: '중국 가오카오', subject: '수학', gen: 'eqhard', qn: 10, time: 120, room: 'gaokao', sec: ['cctv', 'pulse'], pulse: 'drone', mech: ['glasscheck', 'peek'],
      staff: [{ type: 'cnproctor', name: '감독관' }, { type: 'cnproctor', name: '부감독관' }],
      stand: [1.8, 3.0], walk: [0.9, 1.6], tell: 0.55, watch: 2.5, speed: 0.13, cross: 0.3, feint: 0.3, sus: 1.3, ai: 7.0, reward: 12000000000, pay: '명문대 장학금',
      news: '가오카오 당국, 수험생 안경을 전부 물에 담갔다. "방수 안경은 못 막았다"',
      head: ['전국 대학 통일 입학시험 (高考)', '수학'], lines: ['高考 · 전국 대학 통일 입학시험', '안경을 물에 담그는 검사 · 드론 감시 중'] },
    { id: 'oxford', act: 2, name: '옥스퍼드 입학 면접', subject: '철학·논리', gen: 'oxford', qn: 5, time: 75, room: 'oxford', layout: 'table', device: 'ar', sec: [], mech: ['interview'],
      staff: [{ type: 'don', name: '철학 교수', fixed: true }, { type: 'don2', name: '논리학 교수', fixed: true }],
      stand: [1.6, 2.8], walk: [1, 1], tell: 0.6, watch: 2.2, speed: 0, cross: 0, feint: 0.25, sus: 1.3, ai: 7.4, reward: 44000000000, pay: '옥스퍼드 장학금',
      head: ['Oxford Admissions Interview', 'Philosophy'], lines: [] },
    { id: 'usmle', act: 2, name: '미국 의사면허 USMLE', subject: 'Step 1', gen: 'med', qn: 6, parts: ['Block 1', 'Block 2', 'Block 3'], time: 70, room: 'testcenter', device: 'tablet', sec: [], mech: ['fatigue', 'swap'],
      swap: [['dean', 'homeroom'], ['agent', 'dean'], ['suneung', 'agent']],
      staff: [{ type: 'dean', name: '감독관' }, { type: 'homeroom', name: '감독관' }],
      stand: [1.6, 2.8], walk: [0.9, 1.6], tell: 0.55, watch: 2.5, speed: 0.13, cross: 0.3, feint: 0.3, sus: 1.35, ai: 7.8, reward: 160000000000, pay: '레지던트 보너스',
      head: ['USMLE Step 1', 'Block'], lines: ['Test Center · Step 1', '블록마다 감독관 교대'] },
    { id: 'cfa', act: 2, name: 'CFA 레벨 3', subject: '포트폴리오 관리', gen: 'cfa', qn: 10, time: 120, room: 'cfa', sec: [], mech: ['idcheck', 'peek'], check: 'calc',
      staff: [{ type: 'dean', name: '감독관' }, { type: 'agent', name: '시험 관리관' }, { type: 'homeroom', name: '감독관' }],
      stand: [1.6, 2.6], walk: [0.9, 1.5], tell: 0.5, watch: 2.6, speed: 0.12, cross: 0.35, feint: 0.3, sus: 1.4, ai: 8.4, reward: 570000000000, pay: '월가 보너스',
      head: ['CFA Level III', 'Portfolio Management'], lines: ['CFA Level III', '승인된 계산기만 허용 · 무작위 검사'] },
    { id: 'calbar', act: 2, name: '캘리포니아 변호사시험', subject: 'Multistate Bar', gen: 'mbe', qn: 12, essay: false, time: 140, room: 'convention', device: 'tablet', sec: ['cctv', 'pulse'], pulse: 'screen', mech: ['peek'],
      staff: [{ type: 'agent', name: '순회 요원' }, { type: 'agent', name: '순회 요원' }, { type: 'agent', name: '순회 요원' }, { type: 'agent', name: '순회 요원' }],
      stand: [1.4, 2.4], walk: [0.8, 1.4], tell: 0.45, watch: 2.6, speed: 0.16, cross: 0.4, feint: 0.4, sus: 1.45, ai: 8.8, reward: 2100000000000, pay: '빅로펌 연봉',
      head: ['California Bar Exam', 'Multistate Bar Examination'], lines: ['California Bar Exam', 'ExamSoft 화면 검사 가동 중'] },
    { id: 'ibank', act: 2, name: '월가 투자은행 최종 면접', subject: '임원 면접', gen: 'ibank', qn: 6, time: 110, room: 'ibank', layout: 'table', device: 'ar', sec: [], mech: ['interview'], boss: true,
      staff: [{ type: 'banker', name: '전무', fixed: true }, { type: 'banker', name: '상무', fixed: true }, { type: 'banker', name: '인사 담당', fixed: true }],
      stand: [1.4, 2.4], walk: [1, 1], tell: 0.5, watch: 2.4, speed: 0, cross: 0, feint: 0.3, sus: 1.5, ai: 9.6, reward: 7400000000000, pay: '사이닝 보너스',
      news: '면접에서도 안경을 쓴다. 기업들 "눈을 보고 말하는 사람을 뽑겠다"',
      head: ['Final Round Interview', 'Managing Directors'], lines: [] },
    // ---- 3막 뇌절 ----
    { id: 'galaxy', act: 3, name: '은하수능', subject: '은하 수학 영역', gen: 'galaxy', qn: 10, time: 120, room: 'space', sec: [], mech: ['threeeyes', 'float', 'peek'],
      staff: [{ type: 'alien', name: '외계인 감독관' }, { type: 'alien', name: '외계인 감독관' }],
      stand: [1.6, 2.6], walk: [0.9, 1.6], tell: 0.5, watch: 2.5, speed: 0.14, cross: 0.35, feint: 0.3, sus: 1.5, ai: 10.5, reward: 27000000000000, pay: '은하 장학금',
      news: '은하 연합, 지구인 수험생 전원에게 EMP 사용 승인',
      head: ['제1회 은하계 수학능력시험', '은하 수학 영역'], lines: ['은하계 수학능력시험', '무중력 주의 · 시험지를 붙잡으세요'] },
    { id: 'afterlife', act: 3, name: '저승 입학시험', subject: '저승 법도', gen: 'afterlife', qn: 10, time: 120, room: 'underworld', sec: [], mech: ['silent', 'teleport', 'peek'],
      staff: [{ type: 'reaper', name: '저승사자' }, { type: 'reaper', name: '저승사자' }, { type: 'yeomra', name: '염라대왕', fixed: true }],
      stand: [1.6, 2.6], walk: [0.9, 1.6], tell: 0.45, watch: 2.6, speed: 0.12, cross: 0.3, feint: 0.3, sus: 1.55, ai: 11.4, reward: 96000000000000, pay: '환생 포인트',
      head: ['저승 입학시험', '저승 법도'], lines: ['저승 입학시험', '촛불이 흔들리면 사자가 가까이 있다'] },
    { id: 'multi', act: 3, name: '평행우주 변호사시험', subject: '다중우주법', gen: 'multilaw', qn: 12, time: 140, room: 'multiverse', sec: ['pulse'], pulse: 'emp', mech: ['clones'],
      staff: [{ type: 'agent', name: '시험 관리관' }],
      stand: [1.6, 2.6], walk: [0.9, 1.5], tell: 0.5, watch: 2.5, speed: 0.13, cross: 0.35, feint: 0.3, sus: 1.5, ai: 12.4, reward: 350000000000000, pay: '다중우주 수임료',
      head: ['제∞회 평행우주 변호사시험', '다중우주법'], lines: ['평행우주 변호사시험', '감독관이 계속 늘어납니다'] },
    { id: 'human', act: 3, name: '인간 인증 시험', subject: '나는 로봇이 아닙니다', gen: 'captcha', qn: 10, time: 120, room: 'server', sec: [], mech: ['human', 'peek'],
      staff: [{ type: 'robot', name: 'AI 감독관' }],
      stand: [1.6, 2.6], walk: [0.9, 1.5], tell: 0.5, watch: 2.4, speed: 0.12, cross: 0.3, feint: 0.3, sus: 1.5, ai: 13.3, reward: 1200000000000000, pay: '인류 인증서',
      head: ['인간 인증 시험', '나는 로봇이 아닙니다'], lines: ['인간 인증 시험', 'AI 사용 감지 시스템 가동'] },
    { id: 'hle', act: 3, name: '인류의 마지막 시험', subject: '모든 것', gen: 'hle', qn: 8, time: 150, room: 'void', sec: [], mech: ['omega'], boss: true,
      staff: [{ type: 'omega', name: '감독관 Ω', fixed: true }],
      stand: [1.2, 2.2], walk: [1, 1], tell: 0.5, watch: 2.0, speed: 0, cross: 0, feint: 0.35, sus: 1.4, ai: 14.5, reward: 4500000000000000, pay: '인류의 미래',
      head: ["Humanity's Last Exam", '모든 것'], lines: [] },
  ],

  // AI 모델 15단계: 2026년 10월 Artificial Analysis 지능 지수 v5 순서 + 3막은 회사마다 이름 규칙을 이어 지음.
  // rel: 처음 합격하면 이 모델이 출시되는 시험 번호(0부터), -1은 처음부터
  models: [
    { name: '도토리 0.5B', note: '광고 보고 쓰는 무료판', rel: -1 },
    { name: '알파카 짝퉁 7B', note: '어디서 받았는지 모름', rel: 0 },
    { name: '딥식 V4.1 플래시', note: '싸고 빠름', rel: 1 },
    { name: '끌로드 하이꾸 5.5', note: '짧게 잘 맞힘', rel: 3 },
    { name: '끼미 K3.1 프로', note: '긴 지문에 강함', rel: 5 },
    { name: '재미나이 4 아르곤', note: '원소 18번', rel: 7 },
    { name: '쳇GBT-6.1 솔', note: '태양급', rel: 12 },
    { name: '쳇GBT-6 아스트라', note: '별들의 모델', rel: 14 },
    { name: '끌로드 오푸스 5.5', note: '대작', rel: 16 },
    { name: '재미나이 4 카본', note: '지능 지수 1위', rel: 18 },
    { name: '끌로드 페이블 5.2', note: '최상위 등급', rel: 19 },
    { name: '쳇GBT-99 울트라 프로 맥스', note: '숫자부터 다름', rel: 20 },
    { name: '끌로드 에픽 6', note: '서사시급', rel: 21 },
    { name: '재미나이 5 오가네손', note: '가장 무거운 원소 118번', rel: 22 },
    { name: '재미나이 6 뉴트로늄', note: '원자번호 0번', rel: 23 },
  ],

  // 장비 25종. unlock: 처음 합격하면 입고되는 시험 번호(-1은 처음부터), caps: 1막·2막·3막에서 살 수 있는 최고 단계,
  // ladder: 단계마다 바뀌는 제품명, price: 가격 = mult x (unlock + step x 지금 단계)번째 시험의 문제당 상금
  // kind: count(대리 응시: 사람 수만큼), group: glass(안경) · device(안경 밖 AI 기기)
  gear: [
    { id: 'lens', name: '촬영·표시 장비', group: 'glass', unlock: -1, caps: [3, 5, 7], mult: 4, step: 1.5,
      gate: { lv: 1, tier: 2 }, // 1단계까지만 팔다가, 2번 시험(편입)에 합격하면 2단계 초소형 카메라가 들어온다 (재고 1개 → 품절 → 텔레그램)
      ladder: ['지우개 액정', '초소형 카메라', '중고 AI 안경', '실리콘밸리 시제품 안경', '군용 정찰 렌즈', '스마트 콘택트렌즈', '뉴럴링코'] },
    { id: 'predict', name: '시선 예측', group: 'glass', unlock: 0, caps: [2, 4, 6], mult: 3, step: 2,
      ladder: ['눈치', '사이드미러 스티커', '후방 카메라', '감독관 동선 AI', '예지몽', '1초 뒤 미래 보기'] },
    { id: 'stealth', name: '스텔스 코팅', group: 'glass', unlock: 1, caps: [2, 4, 6], mult: 3, step: 2,
      ladder: ['무광 스프레이', '뿔테 위장', '반사 방지 나노 코팅', '광학 위장 필름', '투명 망토 원단', '존재감 지우개'] },
    { id: 'bot', name: '대리 응시', group: 'device', unlock: 1, kind: 'count', caps: [200, 200, 200] },
    { id: 'earbud', name: 'AI 이어폰', group: 'device', unlock: 2, caps: [2, 4, 5], mult: 3, step: 2.5,
      ladder: ['줄 숨긴 유선 이어폰', '콩나물 무선 이어폰', '골전도 이어폰', '어금니 스피커', '텔레파시'] },
    { id: 'deepcam', name: '딥페이크 웹캠', group: 'device', unlock: 3, caps: [2, 2, 2], mult: 3, step: 1, ladder: ['내 사진 붙이기', '무한 루프 영상'] },
    { id: 'watch', name: '스마트워치', group: 'device', unlock: 3, caps: [2, 3, 4], mult: 2, step: 3,
      ladder: ['전자시계', '수상한 스마트워치', '시간 왜곡 시계', '시간 정지 시계'] },
    { id: 'wide', name: '광각 렌즈', group: 'glass', unlock: 4, caps: [0, 0, 0], // 지금은 팔지 않는다 (한 번에 여러 문제는 너무 셈)
      mult: 8, step: 5, ladder: ['어안 렌즈', '파노라마 렌즈', '360도 겹눈'] },
    { id: 'cctvjam', name: 'CCTV 재머', group: 'device', unlock: 5, caps: [2, 3, 3], mult: 4, step: 2, ladder: ['렌즈 스티커', '루프 영상', '위성 사각지대 지도'] },
    { id: 'coach', name: '면접 코치', group: 'device', unlock: 6, caps: [2, 3, 4], mult: 4, step: 3, ladder: ['면접 유튜브', '취업 컨설턴트', '헤드헌터 AI', '인사팀장 분신'] },
    { id: 'autooff', name: '자동 소등 칩', group: 'glass', unlock: 7, caps: [2, 2, 2], mult: 3, step: 1, ladder: ['자동 소등 칩', '자동 소등 칩 개량형'] },
    { id: 'jammer', name: '전파 위장기', group: 'device', unlock: 9, caps: [1, 2, 3], mult: 4, step: 2.5, ladder: ['와이파이 위장', '드론 교란기', '전파 블랙홀'] },
    { id: 'autoscan', name: '자동 스캔 칩', group: 'glass', unlock: 20, caps: [0, 0, 2], // 외계 구간에서만: 손이 필요 없어지는 건 맨 끝
      mult: 6, step: 4, ladder: ['매크로 칩', '습관 학습 칩', '무의식 스캔'] },
    { id: 'glasscase', name: '안경 방수', group: 'glass', unlock: 13, caps: [0, 2, 2], mult: 3, step: 1, ladder: ['생활 방수 코팅', '완전 방수 실링'] },
    { id: 'gazefix', name: '시선 보정 렌즈', group: 'glass', unlock: 14, caps: [0, 2, 2], mult: 3, step: 1, ladder: ['시선 보정 렌즈', '눈 맞춤 합성 렌즈'] },
    { id: 'eyedrop', name: '인공눈물 칩', group: 'device', unlock: 15, caps: [0, 2, 2], mult: 3, step: 1, ladder: ['인공눈물 칩', '안구 냉각 칩'] },
    { id: 'calccover', name: '계산기 위장 커버', group: 'device', unlock: 16, caps: [0, 2, 2], mult: 3, step: 1, ladder: ['계산기 스티커', '승인 계산기 껍데기'] },
    { id: 'screenfilm', name: '화면 위장 필름', group: 'device', unlock: 17, caps: [0, 2, 2], mult: 3, step: 1, ladder: ['정보 보호 필름', '감시 프로그램 미러 필름'] },
    { id: 'taste', name: 'AI 미각 센서', group: 'device', unlock: 18, caps: [0, 0, 0], // 테이스팅 시험을 뺀 뒤로 팔지 않는다
      mult: 3, step: 0.5, ladder: ['혀끝 센서', '어금니 분광기', '와인 전문가 미각 이식'] },
    { id: 'thirdeye', name: '제3의 눈 렌즈', group: 'glass', unlock: 19, caps: [0, 0, 2], mult: 3, step: 1, ladder: ['제3의 눈 렌즈', '외계 시야 렌즈'] },
    { id: 'candle', name: '촛불 감지기', group: 'device', unlock: 20, caps: [0, 0, 2], mult: 3, step: 1, ladder: ['촛불 감지기', '저승 풍향계'] },
    { id: 'clone', name: '평행우주 분신', group: 'device', unlock: 21, caps: [0, 0, 3], mult: 3, step: 0.7, ladder: ['분신 한 명', '분신 두 명', '분신 세 명'] },
    { id: 'humanmod', name: '인간 흉내 모듈', group: 'glass', unlock: 22, caps: [0, 0, 2], mult: 3, step: 0.7, ladder: ['일부러 틀리기 모듈', '완벽한 인간 연기'] },
    { id: 'offbeat', name: '엇박자 칩', group: 'glass', unlock: 23, caps: [0, 0, 2], mult: 3, step: 0.5, ladder: ['엇박자 칩', '무작위 신경 칩'] },
  ],
  // 대리 응시는 사람 수에 따라 이름이 바뀐다: [몇 명부터, 이름]
  // 온라인 석차표(Supabase). 둘 다 비어 있으면 이 기기의 기록만 쓴다. key는 공개용(anon) 키만 넣는다
  online: { url: 'https://ihuuplhpyjnvxsmqdxjs.supabase.co', key: 'sb_publishable_L01UcbYFw98DcsPKhjTI7g_292HWyyn' },
  // 숨은 장면 스위치. 지금은 전부 꺼 둔다. 다시 넣으려면 true로 바꾸면 된다 (코드는 그대로 남아 있다)
  eggs: { stairs: false, cat: false, choco: false }, // stairs: LEET 쉬는 시간의 계단 질주 · cat: 계단 끝의 고양이 · choco: 고시원 책상의 초콜릿
  bot_names: [[1, '대리 응시 챗봇'], [10, '로봇청소기 개조'], [25, '대리 응시 안드로이드'], [50, '내 클론'], [100, '평행우주의 나']],
  bot_milestones: [10, 25, 50, 100], // 대리 응시가 이 인원을 넘을 때마다 수입 x2
};
