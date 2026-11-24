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
  fee_ratio: { value: 0.18, min: 0, max: 1, step: 0.01 },          // 응시료 = 만점 상금 x 이 비율
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
  listen_time: { value: 4.2, min: 0.5, max: 6, step: 0.1 },        // 이어폰 AI가 듣기 문항을 받아쓰는 시간(초)
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
  // [블랙홀] 시공간 요동: 아직 답하지 않은 문제의 보기 순서가 가끔 섞인다 (렌즈의 AI 표시는 다시 스캔해야 새 자리에 뜬다)
  reshuffle_gap_min: { value: 7, min: 2, max: 30, step: 0.5 },       // [블랙홀] 섞이는 간격(초) 최소
  reshuffle_gap_max: { value: 12, min: 2, max: 40, step: 0.5 },      // [블랙홀] 섞이는 간격(초) 최대
  reshuffle_grace: { value: 3, min: 0, max: 10, step: 0.5 },         // [블랙홀] 새 문제가 뜬 뒤 이만큼은 섞지 않는다(초)
  reshuffle_tell: { value: 0.8, min: 0.2, max: 2, step: 0.1 },       // [블랙홀] 섞이기 전 시험지가 떨리는 시간(초) — 이때 바로 마킹하면 안 섞인다
  reshuffle_warp: { value: 0.7, min: 0.2, max: 2, step: 0.1 },       // [블랙홀] 시험지가 일그러지며 섞이는 시간(초)
  reshuffle_keep_contact: { value: 0.25, min: 0, max: 1, step: 0.05 }, // [블랙홀] 섞인 뒤 3초 안에 다시 누르면 이어서 스캔하는 지점: 콘택트렌즈
  reshuffle_keep_brain: { value: 0.5, min: 0, max: 1, step: 0.05 },  // [블랙홀] 같은 값: 뉴럴링코 이상 (그 아래 렌즈는 처음부터)
  clone_gap: { value: 11, min: 3, max: 40, step: 0.5 },            // 평행우주 감독관이 한 명 더 나오는 간격(초)
  clone_max: { value: 5, min: 1, max: 8, step: 1 },                // 평행우주 감독관 최대 인원
  ai_sus_gain: { value: 0.22, min: 0, max: 1, step: 0.01 },        // 인간 인증: AI 답을 고를 때마다 AI 의심도 +
  ai_sus_drop: { value: 0.12, min: 0, max: 1, step: 0.01 },        // 인간 인증: 직접 고를 때마다 AI 의심도 -
  omega_window: { value: 0.45, min: 0.1, max: 1.5, step: 0.05 },   // Ω: 같은 박자로 스캔하면 들킴 (간격 차이 허용 초)
  omega_jump: { value: 0.3, min: 0, max: 1, step: 0.05 },
  omega_grow: { value: 0.2, min: 0, max: 1, step: 0.05 },          // Ω: 문제를 풀수록 읽는 박자 폭이 넓어지는 비율 (문항당)
  omega_floor: { value: 0.4, min: 0, max: 1, step: 0.05 },         // Ω: 엇박자 칩을 다 달아도 남는 비율
  ib_strikes: { value: 3, min: 1, max: 9, step: 1 },               // [해외 보스] 페이즈마다 이만큼 들키거나(1·2) 놓치면(3) 끝
  ib1_blocks: { value: 72, min: 20, max: 160, step: 2 },           // [해외 보스 1] 블록 러시: 입력할 블록 수
  ib1_sent: { value: 12, min: 4, max: 24, step: 1 },                // [해외 보스 1] 프롬프터 속사: 문장 수 (문장마다 블록 8~12개)
  ib1_scan: { value: 0.17, min: 0.05, max: 0.6, step: 0.01 },      // [해외 보스 1] 스캔으로 블록 하나를 읽는 시간(초)
  ib1_rate: { value: 0.24, min: 0.1, max: 0.6, step: 0.01 },       // [해외 보스 1] 블록 하나에 주는 시간(초). 뒤로 갈수록 18% 짧아진다
  ib1_time: { value: 75, min: 30, max: 180, step: 1 },             // [해외 보스 1] 제한 시간(초)
  ib1_acc: { value: 0.85, min: 0.5, max: 1, step: 0.01 },          // [해외 보스 1] 통과 정확도
  ib1_stack: { value: 12, min: 6, max: 20, step: 1 },              // [해외 보스 1] 쌓이는 칸 수. 넘치면 맨 아래가 떨어진다
  ib2_q: { value: 8, min: 3, max: 16, step: 1 },                   // [해외 보스 2] 서류 훔쳐보기: 질문 수
  ib2_life: { value: 7, min: 4, max: 20, step: 0.5 },              // [해외 보스 2] 첫 질문의 제한 시간(초). 마지막은 71%(5초)
  ib2_scan: { value: 0.9, min: 0.2, max: 3, step: 0.05 },          // [해외 보스 2] 서류 한 장을 읽는 시간(초)
  ib2_pass: { value: 0.875, min: 0.5, max: 1, step: 0.01 },          // [해외 보스 2] 리듬 면접 통과 정확도
  ib2_window: { value: 0.13, min: 0.05, max: 0.3, step: 0.01 },    // [해외 보스 2] 박자 판정 폭(± 초)
  ib3_q: { value: 18, min: 6, max: 40, step: 1 },                  // [해외 보스 3] 질문 수 (함정 포함)
  ib3_life: { value: 8, min: 3, max: 20, step: 0.5 },              // [해외 보스 3] 첫 질문의 제한 시간(초). 갈수록 짧아진다
  ib3_scan: { value: 0.6, min: 0.1, max: 3, step: 0.05 },          // [해외 보스 3] 안경이 질문 하나를 읽어 답을 만드는 시간(초)
  hle_beam: { value: 0.3, min: 0.05, max: 0.6, step: 0.01 },       // [외계 보스 1] 시선 빔의 폭 (방 너비 대비)
  hle_press: { value: 1.5, min: 1, max: 3, step: 0.05 },           // [외계 보스] Ω 앞에서 스캔이 느려지는 배율 (틈의 길이도 여기에 맞춰진다)
  hle_sus: { value: 2.5, min: 0.5, max: 10, step: 0.1 },           // [외계 보스] Ω가 보는 동안 스캔하면 초당 오르는 의심 (은신 장비 무시)
  hle_bait: { value: 0.4, min: 0, max: 0.7, step: 0.02 },          // [외계 보스] 스캔이 안 끝나는 미끼 틈의 비율 (1단계 기준, 2·3단계는 조금 낮다)
  hle_q: { value: 6, min: 3, max: 12, step: 1 },                   // [외계 보스 1·2] 단계마다 문제 수
  hle_time: { value: 70, min: 30, max: 180, step: 1 },             // [외계 보스 1·2] 단계마다 제한 시간(초)
  hle_race_q: { value: 12, min: 3, max: 15, step: 1 },             // [외계 보스 4] 거울 속 나와 겨루는 문제 수
  hle_mirror: { value: 1.35, min: 0.5, max: 2, step: 0.05 },        // [외계 보스 4] 거울 속 내가 한 문제에 쓰는 시간 배율 (작을수록 빠르다)
  hle_sc_n: { value: 8, min: 2, max: 8, step: 1 },                  // [외계 보스 3 대본] 문장 수
  hle_sc_time: { value: 150, min: 40, max: 240, step: 5 },          // [외계 보스 3 대본] 전체 제한 시간(초)
  hle_sc_base: { value: 2.5, min: 0.5, max: 8, step: 0.1 },         // [외계 보스 3 대본] Ω 눈꺼풀이 다 감기기까지: 기본 시간(초)
  hle_sc_per: { value: 1.0, min: 0.3, max: 3, step: 0.05 },         // [외계 보스 3 대본] 블록 하나마다 더해지는 시간(초)
  hle_sc_show: { value: 1.0, min: 0.3, max: 3, step: 0.1 },         // [외계 보스 3 대본] 쪼개지기 전에 대본이 온전히 보이는 시간(초)
  omega_strip: { value: 2, min: 1, max: 8, step: 1 },              // Ω: 이만큼 문제를 풀 때마다 안경이 한 단계씩 내려간다          // Ω에게 박자를 읽히면 오르는 의심도

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
  edge_cap: { value: 2, min: 0, max: 4, step: 1 },                 // [장비 우위] 시험보다 앞선 단계를 최대 몇 단계까지 쳐 주나
  edge_lens: { value: 0.25, min: 0, max: 0.6, step: 0.05 },        // 안경이 한 단계 앞설 때마다 스캔 시간 -
  edge_cover: { value: 0.3, min: 0, max: 0.6, step: 0.05 },        // 위장이 한 단계 앞설 때마다 의심 오르는 속도 -
  edge_model: { value: 0.15, min: 0, max: 0.6, step: 0.05 },       // AI 모델이 한 단계 앞설 때마다 스캔 시간 -
  gear_cut: { value: 0.5, min: 0, max: 1, step: 0.05 },            // 시험 전용 장비 단계당 그 장치 효과 감소 (2단계면 무력화)
  taste_bonus: { value: 0.12, min: 0, max: 0.4, step: 0.01 },      // AI 미각 센서 단계당 테이스팅 정답률 +
  taste_need: { value: 0.25, min: 0, max: 0.6, step: 0.01 },       // 미각 센서가 없을 때 테이스팅 AI 정답률 -
  gaze_cut: { value: 0.25, min: 0, max: 0.5, step: 0.01 },         // 시선 보정 렌즈 단계당 마주 보는 시험 의심도 -
  break_time: { value: 2.5, min: 0.5, max: 8, step: 0.5 },         // 교시·모듈·블록 사이 쉬는 시간(초)
  zoom_time: { value: 0.8, min: 0.1, max: 1.5, step: 0.05 },      // 고시원에서 노트북·일정표·폰으로 다가가는 시간(초)
  candle_bonus: { value: 0.4, min: 0, max: 1.5, step: 0.05 },      // 촛불 감지기 단계당 저승사자 낌새 +초
  // [저승] 저승 입학시험: 세 번 부르기 · 물방울 망자
  call_first: { value: 7, min: 2, max: 30, step: 0.5 },            // [저승] 시작 뒤 첫 부름까지(초)
  call_gap_min: { value: 10, min: 3, max: 40, step: 0.5 },         // [저승] 부름 묶음 사이 최소 간격(초)
  call_gap_max: { value: 16, min: 3, max: 40, step: 0.5 },         // [저승] 부름 묶음 사이 최대 간격(초)
  call_step_min: { value: 1.7, min: 0.5, max: 5, step: 0.1 },      // [저승] 첫·둘·셋째 부름 사이 최소(초)
  call_step_max: { value: 2.4, min: 0.5, max: 5, step: 0.1 },      // [저승] 첫·둘·셋째 부름 사이 최대(초)
  call_tail: { value: 1.1, min: 0.3, max: 3, step: 0.1 },          // [저승] 셋째 부름 뒤 돌아볼 마지막 여유(초)
  call_look: { value: 0.2, min: 0, max: 1, step: 0.05 },           // [저승] 그 사자 쪽을 이만큼 보고 있어야 부름이 끝난다(초)
  sea_breath_idle: { value: 26, min: 8, max: 90, step: 1 },         // [용궁] 가만히 있을 때 숨이 바닥나기까지(초). 저절로 차지 않는다
  sea_breath_scan: { value: 9, min: 3, max: 40, step: 0.5 },        // [용궁] 스캔하는 동안 숨이 바닥나기까지(초)
  sea_breath_time: { value: 1.5, min: 0.5, max: 4, step: 0.1 },     // [용궁] 숨 쉬는 동작의 길이(초). 그동안 스캔·답 표시 불가
  sea_flail: { value: 3, min: 1, max: 8, step: 0.5 },               // [용궁] 숨이 바닥나 허우적거릴 때 감독관 전원이 나를 보는 시간(초)
  ghost_gap_min: { value: 8, min: 3, max: 40, step: 0.5 },         // [저승] 망자가 다시 내 자리로 오기까지 최소(초)
  ghost_gap_max: { value: 14, min: 3, max: 40, step: 0.5 },        // [저승] 망자가 다시 내 자리로 오기까지 최대(초)
  ghost_stay_min: { value: 2.6, min: 0.5, max: 8, step: 0.1 },     // [저승] 내 자리 위에서 물을 떨어뜨리는 시간 최소(초)
  ghost_stay_max: { value: 3.8, min: 0.5, max: 8, step: 0.1 },     // [저승] 내 자리 위에서 물을 떨어뜨리는 시간 최대(초)
  ghost_drip: { value: 0.55, min: 0.15, max: 2, step: 0.05 },      // [저승] 물방울 사이 간격(초)

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

  sound: { amb: true, music: true }, // amb: 시험장 생활 소음(시계·연필·기침) · music: 고시원 배경 음악과 마지막 시험 음악
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
    { id: 'suneung', fee: 250, act: 1, name: '대학수학능력시험', subject: '수학 영역', gen: 'eq', qn: 8, time: 100, room: 'suneung', sec: [], mech: ['metal'],
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
    { id: 'toefl', act: 1, name: '토플 홈에디션', subject: 'Reading', gen: 'toefl', qn: 6, time: 80, room: 'home', device: 'laptop', sec: [], mech: ['webcam', 'lookcount'], lookLimit: 10,
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
    { id: 'sat', act: 2, name: '미국 SAT', subject: 'Reading & Math', gen: 'sat', qn: 6, parts: ['Module 1', 'Module 2'], time: 70, room: 'usclass', device: 'tablet', sec: [], mech: ['adaptive', 'visit', 'mole'],
      staff: [{ type: 'teacher', name: '감독 선생님', visit: 'coffee' }, { type: 'dean', name: '시험 관리관' }],
      stand: [2.0, 3.2], walk: [1.0, 1.8], tell: 0.65, watch: 2.3, speed: 0.12, cross: 0.25, feint: 0.2, sus: 1.2, ai: 6.6, reward: 3400000000, pay: '미국 대학 장학금',
      head: ['SAT · Bluebook', 'Reading and Writing / Math'], lines: ['SAT Test Day', 'Phones in bags · No smart glasses'] },
    { id: 'gaokao', act: 2, name: '중국 가오카오', subject: '수학', gen: 'eqhard', qn: 10, time: 120, room: 'gaokao', sec: ['cctv'], mech: ['glasscheck', 'peek', 'drone'],
      staff: [{ type: 'cnproctor', name: '감독관' }, { type: 'cnproctor', name: '부감독관' }],
      stand: [1.8, 3.0], walk: [0.9, 1.6], tell: 0.55, watch: 2.5, speed: 0.13, cross: 0.3, feint: 0.3, sus: 1.3, ai: 7.0, reward: 12000000000, pay: '명문대 장학금',
      news: '가오카오 당국, 수험생 안경을 전부 물에 담갔다. "방수 안경은 못 막았다"',
      head: ['전국 대학 통일 입학시험 (高考)', '수학'], lines: ['高考 · 전국 대학 통일 입학시험', '안경을 물에 담그는 검사 · 순찰 드론 비행 중'] },
    { id: 'oxford', act: 2, name: '옥스퍼드 입학 면접', subject: '철학·논리', gen: 'oxford', qn: 5, time: 75, room: 'oxford', layout: 'table', device: 'ar', sec: [], mech: ['interview'],
      staff: [{ type: 'don', name: '철학 교수', fixed: true }, { type: 'don2', name: '논리학 교수', fixed: true }],
      stand: [1.6, 2.8], walk: [1, 1], tell: 0.6, watch: 2.2, speed: 0, cross: 0, feint: 0.25, sus: 1.3, ai: 7.4, reward: 44000000000, pay: '옥스퍼드 장학금',
      head: ['Oxford Admissions Interview', 'Philosophy'], lines: [] },
    { id: 'usmle', act: 2, name: '미국 의사면허 USMLE', subject: 'Step 1', gen: 'med', qn: 6, parts: ['Block 1', 'Block 2', 'Block 3'], time: 70, room: 'testcenter', device: 'tablet', sec: [], mech: ['swap', 'mole'],
      swap: [['dean', 'homeroom'], ['agent', 'dean'], ['suneung', 'agent']],
      staff: [{ type: 'dean', name: '감독관' }, { type: 'homeroom', name: '감독관' }],
      stand: [1.6, 2.8], walk: [0.9, 1.6], tell: 0.55, watch: 2.5, speed: 0.13, cross: 0.3, feint: 0.3, sus: 1.35, ai: 7.8, reward: 160000000000, pay: '레지던트 보너스',
      head: ['USMLE Step 1', 'Block'], lines: ['Test Center · Step 1', '블록마다 감독관 교대'] },
    { id: 'cfa', act: 2, name: 'CFA 레벨 3', subject: '포트폴리오 관리', gen: 'cfa', qn: 10, time: 120, room: 'cfa', sec: [], mech: ['idcheck', 'peek', 'mole'], check: 'calc',
      staff: [{ type: 'dean', name: '감독관' }, { type: 'agent', name: '시험 관리관' }, { type: 'homeroom', name: '감독관' }],
      stand: [1.6, 2.6], walk: [0.9, 1.5], tell: 0.5, watch: 2.6, speed: 0.12, cross: 0.35, feint: 0.3, sus: 1.4, ai: 8.4, reward: 570000000000, pay: '월가 보너스',
      head: ['CFA Level III', 'Portfolio Management'], lines: ['CFA Level III', '승인된 계산기만 허용 · 무작위 검사'] },
    { id: 'calbar', act: 2, name: '캘리포니아 변호사시험', subject: 'Multistate Bar', gen: 'mbe', qn: 12, essay: false, time: 140, room: 'convention', device: 'tablet', sec: ['cctv', 'pulse'], pulse: 'screen', mech: ['peek', 'mole'],
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
    { id: 'hle', act: 3, name: '인류의 마지막 시험', subject: '모든 것', gen: 'hle', qn: 5, time: 85, parts: ['1단계 · 관찰', '2단계 · 학습', '3단계 · 예측', '최종 단계'], room: 'void', sec: [], mech: ['omega'], boss: true, noAuto: true,
      staff: [{ type: 'omega', name: '감독관 Ω', fixed: true }],
      stand: [1.2, 2.2], walk: [1, 1], tell: 0.5, watch: 2.0, speed: 0, cross: 0, feint: 0.35, sus: 1.4, ai: 14.5, reward: 4500000000000000, pay: '인류의 미래',
      head: ["Humanity's Last Exam", '모든 것'], lines: [] },
  ],

  // 텔레그램 조력자: 정해진 시험이 열리면 먼저 연락한다. tier: 그 시험 번호, need: 없으면 응시할 수 없음, mult: 값 = 그 시험의 문제당 상금 x mult
  // (국내의 필수는 지금 있는 초소형 카메라 품절 장면이라 여기에는 다섯 개만 있다)
  helper: [
    { id: 'cctvmap', tier: 6, need: false, mult: 2, name: 'CCTV 사각 지도', effect: 'CCTV에 찍혀도 의심이 절반만 오른다',
      lines: [['관세사 보시죠? 이번부터 시험장에 CCTV가 달립니다.', false], ['그걸 어떻게 아세요', true], ['카메라마다 안 닿는 자리가 있습니다. 지도, 필요하시죠.', false]], done: '보냈습니다. 지도는 외우고 지우세요.' },
    { id: 'visa', tier: 13, need: true, mult: 3, name: '여권 · 비자 급행', effect: '해외 시험에 응시할 수 있다', block: '여권과 비자가 없어요 · 텔레그램을 확인하세요',
      lines: [['국내는 다 끝내셨네요. 이제 나가셔야죠.', false], ['SAT는 미국에서만 봅니다. 여권도 비자도 없으시잖아요.', false], ['…구해 줄 수 있어요?', true], ['사흘이면 됩니다. 값은 좀 나갑니다.', false]], done: '공항에서 뵙죠. 아, 뵐 일은 없겠네요.' },
    { id: 'leak', tier: 19, need: false, mult: 2, name: '면접 질문지', effect: '투자은행 면접에서 문항마다 대본 두 줄이 미리 읽혀 있다',
      lines: [['월가 최종 면접까지 가셨군요.', false], ['임원들이 뭘 물을지, 제가 좀 압니다.', false], ['어떻게요', true], ['묻지 않는 게 서로 좋습니다.', false]], done: '질문지 보냈습니다. 답은 안경이 알아서 하겠죠.' },
    { id: 'trans', tier: 20, need: true, mult: 3, name: '외계어 번역 팩', effect: '외계 시험에 응시할 수 있다', block: 'AI가 외계 문자를 읽지 못해요 · 텔레그램을 확인하세요',
      lines: [['지구 시험은 여기까지입니다.', false], ['다음은 은하수능인데, 당신 AI는 그쪽 글자를 못 읽습니다.', false], ['그걸 왜 당신이 알아요', true], ['번역 팩, 필요하시죠.', false]], done: '설치됐습니다. 이제부터는 저도 처음 가 보는 곳입니다.' },
    { id: 'coin', tier: 21, need: false, mult: 2, name: '노잣돈', effect: '저승 입학시험에서 저승사자 한 명이 40초 늦게 온다',
      lines: [['저승 시험장에는 사자가 둘입니다.', false], ['한 명은 돈을 받습니다. 예전부터 그랬어요.', false], ['…예전부터?', true], ['노잣돈, 대신 전해 드리죠.', false]], done: '전했습니다. 한 분은 좀 늦으실 겁니다.' },
  ],
  // 실험 중인 새 시험 (테스트용). 주소에 ?exam=<id> 를 붙이면 slot 번째 시험 자리에서 대신 열린다. 난이도·상금은 그 자리 시험을 물려받는다
  lab: {
    ielts: { slot: 15, act: 2, name: 'IELTS 스피킹', subject: 'Speaking Part 3', gen: 'ielts', qn: 5, time: 80, room: 'ielts', layout: 'table', device: 'ar', sec: [], mech: ['interview'], staff: [{ type: 'teacher', name: '시험관', fixed: true }], head: ['IELTS Speaking Test', 'Part 3'], lines: [],
      how: '시험관과 1대1 · 녹음되는 대화', beat: '시험관이 메모하느라 고개를 숙일 때 왼쪽 대본을 읽어 두고, 읽어 둔 만큼만 말한다' },
    todai: { slot: 14, act: 2, name: '도쿄대 본고사', subject: '국어 논술', gen: 'spell', essayAll: 'TODAI', qn: 3, time: 150, room: 'todai', sec: [], mech: ['essayall'], staff: [{ type: 'dean', name: '시험 감독' }, { type: 'suneung', name: '보조 감독' }], head: ['東京大学 第2次学力試験', '国語'], lines: ['東京大学 個別学力試験', '答案はすべて手書き'],
      how: '객관식이 없다 · 전부 손으로 쓰는 서술형', beat: '모범 답안 한 줄을 읽고(위험) 그 줄을 옮겨 쓴다(안전). 감독이 볼 때는 쓰기만 한다' },
    iit: { slot: 18, act: 2, name: '인도 IIT-JEE', subject: 'Physics · Mathematics', gen: 'iit', qn: 14, time: 170, room: 'iit', device: null, sec: ['pulse'], pulse: 'drone', mech: ['crowd', 'peek'], staff: [{ type: 'cnproctor', name: '감독관' }, { type: 'cnproctor', name: '감독관' }, { type: 'cnproctor', name: '감독관' }, { type: 'agent', name: '경찰' }], head: ['JEE (Advanced)', 'Paper 1'], lines: ['JEE (Advanced)', '창밖 접근 금지 · 드론 순찰 중'],
      how: '체육관에 천 명 · 문제 14개 · 감독관 넷 · 드론', beat: '감독관이 많아 안전한 틈이 짧다. 다른 수험생이 걸려 감독관이 몰려갈 때 몰아서 읽는다' },
    bac: { slot: 16, act: 2, name: '프랑스 바칼로레아', subject: '철학 논술', gen: 'spell', essayAll: 'BAC', qn: 1, time: 150, room: 'bac', device: null, parts: null, sec: [], mech: ['essayall', 'visit'], staff: [{ type: 'ta', name: '감독 교사' }, { type: 'prof', name: '장학관', visit: 'drop' }], head: ['Baccalauréat général', 'Philosophie'], lines: ['Baccalauréat · Philosophie', '4시간 · 한 문제'],
      how: '네 시간짜리 논술 한 문제 · 여덟 줄', beat: '한 줄씩 읽고 옮겨 쓴다. 읽은 줄은 5초 안에 쓰지 않으면 잊는다. 장학관이 불쑥 들어온다' },
    gre: { slot: 16, act: 2, name: 'GRE 시험센터', subject: 'Verbal · Quant', gen: 'sat', qn: 10, time: 130, room: 'testcenter', device: 'tablet', parts: null, sec: ['cctv'], mech: ['idcheck', 'mole'], staff: [{ type: 'agent', name: '센터 직원' }, { type: 'dean', name: '센터 직원' }], head: ['GRE General Test', 'Verbal Reasoning'], lines: ['GRE Test Center', '자리마다 카메라 · 손바닥 인증'],
      how: '칸막이 자리 · 머리 위 카메라 · 불시 손바닥 인증', beat: '카메라가 내 쪽을 볼 때와 직원이 책상 앞에 설 때는 멈춘다' },
    taxi: { slot: 19, act: 2, name: '런던 택시기사 시험', subject: 'The Knowledge · 구술', gen: 'taxi', qn: 5, time: 90, room: 'taxi', layout: 'table', device: 'ar', sec: [], mech: ['interview'], boss: false, staff: [{ type: 'prof', name: '시험관', fixed: true }], head: ['The Knowledge of London', 'Appearance'], lines: [],
      how: '출발지와 도착지를 주면 길을 말로 왼다', beat: '시험관이 지도를 볼 때 경로를 읽어 두고, 막힘없이 말한다' },
    nasa: { slot: 17, act: 2, name: 'NASA 우주비행사 선발', subject: '회전 장치 필기', gen: 'orbit', qn: 8, time: 145, room: 'nasa', sec: [], mech: ['spin'], check: null, staff: [{ type: 'agent', name: '선발관' }, { type: 'dean', name: '선발관' }], head: ['Astronaut Candidate Selection', 'Written Test'], lines: ['Astronaut Selection', '다축 회전 장치 가동 중'],
      how: '도는 장치 안에서 필기 · 화면이 기운다', beat: '화면이 많이 기울수록 스캔이 느리다. 수평에 가까울 때 읽는다' },
    mars: { slot: 20, act: 3, name: '화성 이주 자격시험', subject: '생존 수학', gen: 'mars', qn: 10, time: 120, room: 'mars', sec: [], mech: ['helmet'], staff: [{ type: 'suneung', name: '이주 관리관' }, { type: 'agent', name: '이주 관리관' }], head: ['Mars Settler Qualification', 'Survival Mathematics'], lines: ['화성 이주 자격시험', '헬멧을 벗지 마시오'],
      how: '우주복을 입고 본다 · 숨을 쉴수록 헬멧에 김이 서린다', beat: '스캔하는 동안 김이 서려 느려지고 앞이 안 보인다. 짧게 끊어 읽고, 김이 걷히길 기다린다' },
    sea: { slot: 21, act: 3, name: '용궁 과거시험', subject: '시무책', gen: 'psat', qn: 10, time: 130, room: 'sea', sec: [], mech: ['breath', 'signal'] /* [용궁] 무중력 흔들림 대신 물속 신호 */, staff: [{ type: 'don', name: '거북 감독관' }, { type: 'don2', name: '잉어 감독관' }], head: ['용궁 과거시험', '시무책'], lines: ['용궁 과거시험', '숨은 알아서 참으시오'],
      how: '물속 · 수면 부표의 AI 신호가 물결 따라 세졌다 약해진다', beat: '신호가 약하면 스캔이 느리고, 해류가 지나가면 끊긴다. 감독관이 안 볼 때와 신호가 좋을 때가 겹칠 때 읽는다. 숨은 계속 줄고 저절로 차지 않는다. 숨쉬기(B)는 1.5초 걸리고 그동안 스캔을 못 하니, 감독관이 볼 때 숨을 쉬고 안 볼 때 읽는다. 숨이 바닥나면 허우적거려 모두가 돌아본다' }, // [용궁]
    dream: { slot: 21, act: 3, name: '꿈속 시험', subject: '기억나지 않는 과목', gen: 'dream', qn: 8, time: 110, room: 'dream', sec: [], mech: ['dream'], staff: [{ type: 'homeroom', name: '담임 선생님' }], head: ['꿈속 시험', '기억나지 않는 과목'], lines: ['꿈속 시험', '눈을 떼면 바뀐다'],
      how: '보는 사이에 보기 순서가 바뀐다', beat: '화면이 일렁이면 곧 바뀐다. 바뀌기 전에 읽고 바로 마킹한다. 바뀌면 처음부터 다시 읽는다' },
    loop: { slot: 22, act: 3, name: '타임루프 재시험', subject: '어제와 같은 시험', gen: 'psat', qn: 5, time: 60, parts: ['1회차', '2회차', '3회차'], room: 'hs', sec: [], pulse: null, mech: ['loop'], staff: [{ type: 'homeroom', name: '담임 선생님' }], head: ['2026학년도 6월 고3 전국연합학력평가', '국어 영역'], lines: ['6월 모의평가', '…또 6월이다'],
      how: '같은 시험이 세 번 되풀이된다 · 첫 시험장 그대로', beat: '감독관은 지난 회차에 내가 숙인 때를 기억하고 그때 본다. 빨간 표시를 피해 다른 때에 읽는다' },
    mirror: { slot: 22, act: 3, name: '거울 나라 시험', subject: '뒤집힌 수학', gen: 'mirror30', qn: 10, time: 120, room: 'mirror', sec: [], pulse: null, mech: ['mirror'], staff: [{ type: 'dean', name: '거울 감독관' }, { type: 'dean', name: '거울 감독관' }], head: ['거울 나라 시험', '수학'], lines: ['거울 나라 시험', '왼쪽이 오른쪽입니다'],
      how: '시험지 글자와 좌우가 뒤집혀 있다', beat: '왼쪽을 누르면 오른쪽을 본다. AI도 뒤집힌 글자를 읽느라 스캔이 느리다' },
    telepathy: { slot: 23, act: 3, name: '텔레파시 학교 입시', subject: '추리', gen: 'logic', qn: 8, time: 120, room: 'tele', sec: [], mech: ['telepathy'], staff: [{ type: 'alien', name: '독심 감독관' }, { type: 'alien', name: '독심 감독관' }], head: ['텔레파시 학교 입학시험', '추리'], lines: ['텔레파시 학교 입학시험', '생각은 조용히'],
      how: '감독관이 생각을 읽는다', beat: '답이 떠 있는 동안 감독관이 보면 의심이 오른다. 답이 뜨면 바로 마킹해서 머리를 비운다' },
    aicourt: { slot: 23, act: 3, name: 'AI 재판소 배심 시험', subject: '판례', gen: 'law', qn: 10, time: 170, room: 'court', sec: ['cctv'], mech: ['peek'], noAuto: true, staff: [{ type: 'robot', name: 'AI 판사' }, { type: 'robot', name: 'AI 서기' }], head: ['AI 재판소 배심원 자격시험', '판례'], lines: ['AI 재판소', '모든 답안은 기록됩니다'],
      how: '감독관이 전부 AI · 자동 마킹이 막히고 CCTV가 돈다', beat: '뉴럴링코의 자동 마킹이 꺼지므로 답을 직접 고른다. CCTV가 내 쪽을 볼 때와 AI 판사가 볼 때는 멈춘다' },
    hole: { slot: 23, act: 3, name: '블랙홀 가장자리 시험', subject: '상대론', gen: 'relativity', qn: 10, time: 130, room: 'hole', sec: [], mech: ['warp', 'reshuffle'], staff: [{ type: 'alien', name: '사건의 지평선 감독관' }, { type: 'alien', name: '사건의 지평선 감독관' }], head: ['사건의 지평선 자격시험', '상대론'], lines: ['블랙홀 가장자리 시험', '시간은 사람마다 다르게 흐릅니다'],
      how: '시간이 빨라졌다 느려졌다 한다', beat: '시간이 빠를 때는 감독관도 시계도 빠르다. 느려졌을 때 몰아서 읽는다' },
    gods: { slot: 23, act: 3, name: '신들의 수능', subject: '신들의 사생활', gen: 'gods', qn: 10, time: 140, room: 'storm', sec: [], mech: ['bolt'], staff: [{ type: 'don', name: '아테나' }, { type: 'don2', name: '헤르메스' }, { type: 'yeomra', name: '제우스', fixed: true }], head: ['올림포스 수학능력시험', '신들의 사생활'], lines: ['올림포스 수학능력시험', '번개가 치면 쇠붙이는 쉽니다'],
      how: '신들만 아는 문제 · 번개가 칠 때마다 장비가 꺼진다', beat: '천둥이 우르릉 하면 곧 번개. 번개가 치면 2.4초 동안 안경이 먹통이고 읽던 것도 날아간다. 그동안은 경고도 안 뜨니 고개를 들고 기다린다' },
    aiiv: { slot: 10, act: 1, name: '대기업 AI 역량검사', subject: '상황 면접', gen: 'aiiv', qn: 5, time: 170, room: 'home', device: 'laptop', sec: [], mech: ['webcam', 'gaze'], think: 6, staff: [{ type: 'webcam', name: 'AI 면접 시스템', fixed: true }], head: ['AI 역량검사', '상황 면접'], lines: [],
      how: '집에서 노트북으로 보는 AI 면접 · 감정평가사 다음 차례', beat: '시선이 5초 넘게 벗어나면 탈락. 대본을 두세 줄씩 끊어 읽고 카메라를 1초 이상 다시 본다. 생각할 시간이 6초로 줄었다' },
    aiiv2: { slot: 17, act: 2, name: '글로벌 기업 AI 대면 면접', subject: 'AI 면접관', gen: 'aiiv', qn: 5, time: 160, room: 'aiface', layout: 'table', device: 'ar', sec: [], mech: ['interview', 'gaze'], think: 4, gazeLimit: 3.5, check: null, staff: [{ type: 'robot', name: 'AI 면접관', fixed: true }], head: ['AI Interview', 'Final Round'], lines: [],
      how: '면접실에서 AI 면접관과 마주 앉는다 · 눈앞에 AI가 있다', beat: '시선 허용이 3.5초로 줄고 생각할 시간은 4초. AI 면접관이 나를 볼 때는 대본이 읽히지 않는다. 고개를 돌린 틈에 한두 줄씩 읽는다' },
  },
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
    // 새 마켓: 세 줄의 사다리. at: 단계마다 그 제품이 입고되는 시험 번호(그 시험이 일정표에 열리면 살 수 있다), 값 = mult x 그 시험의 문제당 상금
    // 사면 바로 장착되고 앞 제품의 기능은 새 제품에 들어 있다. 아래 hidden 줄들은 이 세 줄에서 계산되는 속 기능이다 (game.js syncGear)
    { id: 'lens', name: '안경', group: 'glass', mult: 4, at: ['mock', 'toeic', 'cpa', 'mdeet', 'ielts', 'usmle', 'ibank', 'galaxy', 'multi'],
      ladder: ['지우개 액정', '초소형 카메라', '중고 AI 안경', '실리콘밸리 시제품 안경', '군용 정찰 렌즈', '스마트 콘택트렌즈', '뉴럴링코', '제3의 눈 렌즈', '겹눈 고글'] },
    { id: 'aux', name: '보조 장비', group: 'aux', mult: 3, at: ['suneung', 'transfer', 'toeic', 'civil7', 'leet', 'sat', 'oxford', 'galaxy', 'afterlife', 'dream', 'aicourt'],
      ladder: ['전자 손목시계', '사이드미러 스티커', '유선 이어폰', '후방 카메라', '골전도 이어폰', '감독관 동선 AI', '어금니 스피커', '무중력 추', '촛불 감지기', '저승 풍향계', '1초 뒤 미래'] },
    { id: 'cover', name: '위장', group: 'cover', mult: 3, at: ['suneung', 'toefl', 'customs', 'tax', 'aiiv', 'gaokao', 'mirror', 'aicourt', 'gods'],
      ladder: ['무광 스프레이', '뿔테 위장', '반사 방지 코팅', '전파 위장 케이스', '딥페이크 세트', '광학 위장 필름', '존재감 지우개', '인간 흉내 가면', '엇박자 메트로놈'] },
    { hidden: true, id: 'predict', name: '시선 예측', group: 'glass', unlock: 0, caps: [2, 4, 6], mult: 3, step: 2,
      ladder: ['눈치', '사이드미러 스티커', '후방 카메라', '감독관 동선 AI', '예지몽', '1초 뒤 미래 보기'] },
    { hidden: true, id: 'stealth', name: '스텔스 코팅', group: 'glass', unlock: 1, caps: [2, 4, 6], mult: 3, step: 2,
      ladder: ['무광 스프레이', '뿔테 위장', '반사 방지 나노 코팅', '광학 위장 필름', '투명 망토 원단', '존재감 지우개'] },
    { hidden: true, id: 'bot', name: '대리 응시', group: 'device', unlock: 1, kind: 'count', caps: [200, 200, 200] },
    { hidden: true, id: 'earbud', name: 'AI 이어폰', group: 'device', unlock: 2, caps: [2, 4, 5], mult: 3, step: 2.5,
      ladder: ['줄 숨긴 유선 이어폰', '콩나물 무선 이어폰', '골전도 이어폰', '어금니 스피커', '텔레파시'] },
    { hidden: true, id: 'deepcam', name: '딥페이크 웹캠', group: 'device', unlock: 3, caps: [2, 2, 2], mult: 3, step: 1, ladder: ['내 사진 붙이기', '무한 루프 영상'] },
    { hidden: true, id: 'watch', name: '스마트워치', group: 'device', unlock: 3, caps: [2, 3, 4], mult: 2, step: 3,
      ladder: ['전자시계', '수상한 스마트워치', '시간 왜곡 시계', '시간 정지 시계'] },
    { hidden: true, id: 'wide', name: '광각 렌즈', group: 'glass', unlock: 4, caps: [0, 0, 0], // 지금은 팔지 않는다 (한 번에 여러 문제는 너무 셈)
      mult: 8, step: 5, ladder: ['어안 렌즈', '파노라마 렌즈', '360도 겹눈'] },
    { hidden: true, id: 'cctvjam', name: 'CCTV 재머', group: 'device', unlock: 5, caps: [2, 3, 3], mult: 4, step: 2, ladder: ['렌즈 스티커', '루프 영상', '위성 사각지대 지도'] },
    { hidden: true, id: 'coach', name: '면접 코치', group: 'device', unlock: 6, caps: [2, 3, 4], mult: 4, step: 3, ladder: ['면접 유튜브', '취업 컨설턴트', '헤드헌터 AI', '인사팀장 분신'] },
    { hidden: true, id: 'autooff', name: '자동 소등 칩', group: 'glass', unlock: 7, caps: [2, 2, 2], mult: 3, step: 1, ladder: ['자동 소등 칩', '자동 소등 칩 개량형'] },
    { hidden: true, id: 'jammer', name: '전파 위장기', group: 'device', unlock: 9, caps: [1, 2, 3], mult: 4, step: 2.5, ladder: ['와이파이 위장', '드론 교란기', '전파 블랙홀'] },
    { hidden: true, id: 'autoscan', name: '자동 스캔 칩', group: 'glass', unlock: 20, caps: [0, 0, 2], // 외계 구간에서만: 손이 필요 없어지는 건 맨 끝
      mult: 6, step: 4, ladder: ['매크로 칩', '습관 학습 칩', '무의식 스캔'] },
    { hidden: true, id: 'glasscase', name: '안경 방수', group: 'glass', unlock: 13, caps: [0, 2, 2], mult: 3, step: 1, ladder: ['생활 방수 코팅', '완전 방수 실링'] },
    { hidden: true, id: 'gazefix', name: '시선 보정 렌즈', group: 'glass', unlock: 14, caps: [0, 2, 2], mult: 3, step: 1, ladder: ['시선 보정 렌즈', '눈 맞춤 합성 렌즈'] },
    { hidden: true, id: 'eyedrop', name: '인공눈물 칩', group: 'device', unlock: 15, caps: [0, 2, 2], mult: 3, step: 1, ladder: ['인공눈물 칩', '안구 냉각 칩'] },
    { hidden: true, id: 'calccover', name: '계산기 위장 커버', group: 'device', unlock: 16, caps: [0, 2, 2], mult: 3, step: 1, ladder: ['계산기 스티커', '승인 계산기 껍데기'] },
    { hidden: true, id: 'screenfilm', name: '화면 위장 필름', group: 'device', unlock: 17, caps: [0, 2, 2], mult: 3, step: 1, ladder: ['정보 보호 필름', '감시 프로그램 미러 필름'] },
    { hidden: true, id: 'taste', name: 'AI 미각 센서', group: 'device', unlock: 18, caps: [0, 0, 0], // 테이스팅 시험을 뺀 뒤로 팔지 않는다
      mult: 3, step: 0.5, ladder: ['혀끝 센서', '어금니 분광기', '와인 전문가 미각 이식'] },
    { hidden: true, id: 'thirdeye', name: '제3의 눈 렌즈', group: 'glass', unlock: 19, caps: [0, 0, 2], mult: 3, step: 1, ladder: ['제3의 눈 렌즈', '외계 시야 렌즈'] },
    { hidden: true, id: 'candle', name: '촛불 감지기', group: 'device', unlock: 20, caps: [0, 0, 2], mult: 3, step: 1, ladder: ['촛불 감지기', '저승 풍향계'] },
    { hidden: true, id: 'clone', name: '평행우주 분신', group: 'device', unlock: 21, caps: [0, 0, 3], mult: 3, step: 0.7, ladder: ['분신 한 명', '분신 두 명', '분신 세 명'] },
    { hidden: true, id: 'humanmod', name: '인간 흉내 모듈', group: 'glass', unlock: 22, caps: [0, 0, 2], mult: 3, step: 0.7, ladder: ['일부러 틀리기 모듈', '완벽한 인간 연기'] },
    { hidden: true, id: 'offbeat', name: '엇박자 칩', group: 'glass', unlock: 23, caps: [0, 0, 2], mult: 3, step: 0.5, ladder: ['엇박자 칩', '무작위 신경 칩'] },
  ],
  // 대리 응시는 사람 수에 따라 이름이 바뀐다: [몇 명부터, 이름]
  // 온라인 석차표(Supabase). 둘 다 비어 있으면 이 기기의 기록만 쓴다. key는 공개용(anon) 키만 넣는다
  online: { url: 'https://ihuuplhpyjnvxsmqdxjs.supabase.co', key: 'sb_publishable_L01UcbYFw98DcsPKhjTI7g_292HWyyn' },
  // 숨은 장면 스위치. 지금은 전부 꺼 둔다. 다시 넣으려면 true로 바꾸면 된다 (코드는 그대로 남아 있다)
  eggs: { stairs: false, cat: false, choco: false }, // stairs: LEET 쉬는 시간의 계단 질주 · cat: 계단 끝의 고양이 · choco: 고시원 책상의 초콜릿
  bot_names: [[1, '대리 응시 챗봇'], [10, '로봇청소기 개조'], [25, '대리 응시 안드로이드'], [50, '내 클론'], [100, '평행우주의 나']],
  bot_milestones: [10, 25, 50, 100], // 대리 응시가 이 인원을 넘을 때마다 수입 x2
  // 시험 42개의 정식 순서 (국내 14 · 해외 14 · 외계 14). 위 tiers의 25개와 lab의 새 시험을 이 순서로 엮는다
  order: ['mock', 'suneung', 'transfer', 'toeic', 'toefl', 'civil7', 'customs', 'tax', 'cpa', 'appraiser', 'aiiv', 'leet', 'mdeet', 'bar',
    'sat', 'ielts', 'todai', 'iit', 'gaokao', 'bac', 'oxford', 'gre', 'usmle', 'aiiv2', 'cfa', 'calbar', 'nasa', 'ibank',
    'galaxy', 'mars', 'sea', 'afterlife', 'dream', 'loop', 'multi', 'mirror', 'telepathy', 'aicourt', 'human', 'hole', 'gods', 'hle'],
  model_rel: [-1, 0, 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38], // AI 모델이 출시되는 시험 번호 (그 시험에 합격하면)
  // 시험마다 정해 둔 값 (고정): [문제 수(교시가 있으면 교시당), 제한 시간(초, 교시당), 만점 상금(원), AI 난도]
  // 만점 상금은 시험마다 약 2.1배씩 오르게 잡았다. 장비·모델·응시료 값은 여기 만점 상금에서 나온다. 밸런스는 이 표의 숫자를 직접 고치면 된다
  exam_table: {
    mock: [5, 60, 1000, 0],
    suneung: [8, 65, 3360, 0.95],
    transfer: [6, 45, 7200, 1.31],
    toeic: [8, 100, 15200, 1.66],
    toefl: [6, 40, 32000, 2.01],
    civil7: [8, 90, 68000, 2.37],
    customs: [10, 120, 144000, 2.72],
    tax: [8, 60, 304000, 3.08],
    cpa: [10, 130, 648000, 3.43],
    appraiser: [10, 80, 1360000, 3.78],
    aiiv: [5, 170, 2880000, 4.14],
    leet: [7, 120, 6080000, 4.49],
    mdeet: [16, 115, 12800000, 4.84],
    bar: [8, 105, 27200000, 5.2],
    sat: [8, 70, 57600000, 5.55],
    ielts: [5, 100, 120000000, 5.9],
    todai: [3, 150, 256000000, 6.26],
    iit: [14, 145, 552000000, 6.61],
    gaokao: [13, 85, 1200000000, 6.97],
    bac: [1, 110, 2480000000, 7.32],
    oxford: [5, 95, 5200000000, 7.67],
    gre: [10, 130, 11200000000, 8.03],
    usmle: [8, 65, 23200000000, 8.38],
    aiiv2: [5, 160, 49600000000, 8.73],
    cfa: [13, 135, 104000000000, 9.09],
    calbar: [16, 125, 224000000000, 9.44],
    nasa: [8, 80, 472000000000, 9.8],
    ibank: [6, 150, 960000000000, 10.15],
    galaxy: [14, 145, 2080000000000, 10.5],
    mars: [10, 120, 4480000000000, 10.86],
    sea: [10, 130, 9600000000000, 11.21],
    afterlife: [14, 170, 20000000000000, 11.56],
    dream: [8, 70, 42400000000000, 11.92],
    loop: [5, 42, 88000000000000, 12.27],
    multi: [16, 185, 192000000000000, 12.62],
    mirror: [10, 120, 400000000000000, 12.98],
    telepathy: [8, 120, 880000000000000, 13.33],
    aicourt: [10, 100, 1760000000000000, 13.69],
    human: [10, 70, 3760000000000000, 14.04],
    hole: [10, 130, 8000000000000000, 14.39],
    gods: [10, 140, 16800000000000000, 14.75],
    hle: [5, 85, 36000000000000000, 15.1],
  },
  // [돈 밸런스] 그 시험이 열릴 때 새로 나오는 제품(장비·AI 모델·조력자) 값의 보정. 합계가 직전 시험 만점 상금의 0.3배(3~6번째 시험: 겨우 합격해도 다 사고 응시료가 남는다) → 1.0배(7~9번째) → 1.4배(10번째부터: 만점이 아니면 한 번 모자란다). 첫 장비(0)와 수능(1)은 모의평가를 60점으로 붙어도 전부 살 수 있게 따로 낮췄다
  cost_fix: {"0": 0.4, "1": 0.0476, "2": 0.3733, "3": 0.1137, "4": 0.38, "5": 0.3765, "6": 0.4722, "7": 1.2632, "8": 0.9383, "9": 1.7788, "10": 1.763, "11": 1.7684, "12": 0.76, "14": 0.8815, "15": 0.768, "18": 0.8587, "20": 1.7805, "21": 1.7333, "22": 1.3517, "24": 1.7805, "27": 0.6119, "28": 0.5169, "30": 1.7422, "31": 1.0752, "32": 1.761, "33": 1.7988, "34": 1.2833, "35": 1.792, "36": 1.697, "37": 0.9333, "39": 1.7547, "40": 1.7778},
  hub_by_act: ['gosi', 'dorm', 'cabin'], // 구간별 거점: 고시원 → 유학생 기숙사 → 우주선 선실
  helper_at: { cctvmap: 'customs', visa: 'sat', leak: 'ibank', trans: 'galaxy', coin: 'afterlife' },
  // 외계 구간(은하수능~신들의 수능): 해외 마지막 시험들보다 감시가 느슨해지지 않게, 뒤로 갈수록 감독관이 더 자주·더 길게 보고 속임수(헛기침)도 늘린다.
  // from은 은하수능, to는 신들의 수능 값이고 그 사이는 순서대로 이어진다. add는 시험마다 어울리는 감시를 하나씩 더한 것 (인류의 마지막 시험은 그대로)
  alien_watch: {
    from: { stand: [1.15, 2.0], walk: [0.75, 1.3], tell: 0.4, watch: 2.9, speed: 0.17, cross: 0.4, feint: 0.42, sus: 1.6 },
    to: { stand: [0.9, 1.6], walk: [0.6, 1.0], tell: 0.32, watch: 3.3, speed: 0.21, cross: 0.45, feint: 0.5, sus: 1.8 },
    add: {
      galaxy: { staff: [{ type: 'alien', name: '은하 감독관' }] },
      mars: { sec: ['cctv'], staff: [{ type: 'agent', name: '이주 관리관' }] },                                                   // 기지 감시 카메라
      sea: { staff: [{ type: 'don2', name: '자라 감독관' }] },                     // [용궁] 감독관 하나 더 (전파 장치는 물속 신호와 겹쳐서 뺌)
      dream: { mech: ['mole'], staff: [{ type: 'homeroom', name: '또 한 명의 담임' }] }, // 꿈속: 같은 선생님이 둘
      loop: { sec: ['cctv'], staff: [{ type: 'dean', name: '시험 관리관' }] },
      multi: { mech: ['drone'], staff: [{ type: 'alien', name: '다른 우주의 감독관' }] },
      mirror: { sec: ['cctv'] },
      telepathy: { sec: ['pulse'], staff: [{ type: 'alien', name: '독심 감독관' }] }, // 뇌파 탐지 · 마음 읽는 감독관 하나 더
      aicourt: { mech: ['drone'] },
      human: { sec: ['cctv'], staff: [{ type: 'robot', name: '보조 판별기' }] },
      hole: { mech: ['drone'], staff: [{ type: 'alien', name: '사건의 지평선 감독관' }] },
      gods: { mech: ['mole'] },                                                  // 앞자리 수험생으로 변장한 신
    },
  },
};
(function () { // 정식 순서대로 시험을 엮고, 상금·난도·입고 시점을 번호로 바꾼다
  const C = window.CONFIG, old = C.tiers, byId = {}; old.forEach(t => { byId[t.id] = t; });
  const tiers = C.order.map(id => { if (byId[id]) return Object.assign({}, byId[id]);
    const Lb = C.lab[id], o = Object.assign({}, old[Lb.slot], { id, news: null, swap: null, boss: false, essay: false, listen: 0, noAuto: false, check: null, pulse: null, parts: null, layout: null, device: null }, Lb);
    for (const k of ['parts', 'layout', 'device', 'pulse', 'check', 'news', 'swap']) if (o[k] == null) delete o[k]; delete o.slot; return o; });
  const ix = id => tiers.findIndex(t => t.id === id);
  tiers.forEach((t, i) => { const [qn, time, prize, ai] = C.exam_table[t.id]; t.qn = qn; t.time = time; t.ai = ai; t.act = i < 14 ? 1 : i < 28 ? 2 : 3;
    t.base = prize / 8; t.reward = prize / (qn * (t.parts ? t.parts.length : 1)); }); // base: 장비 값의 기준(문제 8개짜리 시험의 문제당 상금으로 환산) · reward: 문제당 상금
  { const A = C.alien_watch, i0 = ix('galaxy'), i1 = ix('gods'); // 외계 구간 감시 강화 (위 alien_watch)
    if (A && i0 >= 0 && i1 > i0) tiers.forEach((t, i) => { if (i < i0 || i > i1) return; const k = (i - i0) / (i1 - i0), L = (a, b) => Array.isArray(a) ? a.map((v, j) => +(v + (b[j] - v) * k).toFixed(2)) : +(a + (b - a) * k).toFixed(3);
      if (t.layout !== 'table') for (const key of Object.keys(A.from)) t[key] = L(A.from[key], A.to[key]);
      const ad = A.add[t.id]; if (ad) { if (ad.mech) t.mech = [...t.mech, ...ad.mech]; if (ad.sec) t.sec = [...(t.sec || []), ...ad.sec]; if (ad.staff) t.staff = [...t.staff, ...ad.staff]; } }); }
  C.tiers = tiers; C.models.forEach((m, i) => { m.rel = C.model_rel[i]; });
  C.gear.forEach(d => { if (d.at) d.at = d.at.map(ix); else d.unlock = 9999; });
  C.helper.forEach(h => { h.tier = ix(C.helper_at[h.id]); });
})();
