// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-17
// 문제 만들기: 시험 종류마다 4지선다를 자동으로 만든다 (정답은 언제나 하나). 대사, 장비 문구, 장치 이름도 여기.
// human: false 인 문제는 사람이 풀 수 없다(외계 문자, 테이스팅, 인류의 마지막 시험). AI 모델이 좋아야 맞힌다.
'use strict';

// 맞춤법: [맞는 말, 틀린 말]. 문맥에 따라 둘 다 맞을 수 있는 짝은 넣지 않는다.
const SPELL = [
  ['며칠', '몇일'], ['설거지', '설겆이'], ['역할', '역활'], ['금세', '금새'], ['왠지', '웬지'],
  ['웬일', '왠일'], ['어떡해', '어떻해'], ['희한하다', '희안하다'], ['일부러', '일부로'], ['오랜만', '오랫만'],
  ['굳이', '구지'], ['곰곰이', '곰곰히'], ['깨끗이', '깨끗히'], ['틈틈이', '틈틈히'], ['됐다', '됬다'],
  ['육개장', '육계장'], ['찌개', '찌게'], ['베개', '베게'], ['떡볶이', '떡볶기'], ['핑계', '핑게'],
  ['할게', '할께'], ['눈곱', '눈꼽'], ['숟가락', '숫가락'], ['무릅쓰다', '무릎쓰다'], ['짜깁기', '짜집기'],
  ['일찍이', '일찌기'], ['개수', '갯수'], ['설렘', '설레임'], ['헤매다', '헤메다'], ['치러야', '치뤄야'],
  ['담가', '담궈'], ['잠가', '잠궈'], ['어이없다', '어의없다'], ['대가', '댓가'], ['내로라하는', '내노라하는'],
  ['돌멩이', '돌맹이'], ['알맞은', '알맞는'], ['걸맞은', '걸맞는'], ['웃어른', '윗어른'], ['위층', '윗층'],
  ['휴게실', '휴계실'], ['웬만하면', '왠만하면'], ['봬요', '뵈요'], ['우레', '우뢰'],
];

const ALIEN_Q = ['다음 중 가장 무거운 별은?', '블랙홀의 맛으로 옳은 것은?', '은하 3번 국도의 제한 속도는?',
  '외계 급식 중 가장 매운 것은?', '토성 고리를 세는 단위는?', '지구인의 주식(主食)은?', '혜성의 꼬리는 몇 개인가?',
  '빛보다 빠른 것을 고르시오.', '안드로메다로 가는 버스 번호는?', '우주 화장실 사용법으로 옳은 것은?'];

// 4지선다 문제 묶음: [문제, 정답, 오답 3개]
const TOEIC = [
  ['The meeting has been ____ until next Monday.', 'postponed', ['postpone', 'postponing', 'postpones']],
  ['Please submit the report ____ Friday.', 'by', ['until', 'since', 'during']],
  ['Ms. Kim is responsible ____ training new staff.', 'for', ['to', 'with', 'of']],
  ['The new policy will take ____ next month.', 'effect', ['affect', 'effective', 'effectively']],
  ['All employees must ____ their ID badges.', 'wear', ['wearing', 'wore', 'worn']],
  ['The manager asked us to work more ____.', 'efficiently', ['efficient', 'efficiency', 'efficiencies']],
  ['Neither the CEO ____ the CFO attended.', 'nor', ['or', 'and', 'but']],
  ['The package arrived ____ than expected.', 'earlier', ['early', 'earliest', 'more early']],
  ['If the client ____ earlier, we would have finished.', 'had called', ['called', 'calls', 'has called']],
  ['The conference room is ____ this afternoon.', 'available', ['availability', 'avail', 'availably']],
  ['Mr. Park has worked here ____ 2019.', 'since', ['for', 'at', 'during']],
  ['Sales were ____ higher this quarter.', 'significantly', ['significant', 'significance', 'signify']],
  ['Applicants need three years of ____ experience.', 'relevant', ['relevance', 'relevantly', 'relate']],
  ['The store will be closed ____ the holiday.', 'during', ['while', 'when', 'as']],
  ['Thank you for ____ our survey.', 'completing', ['complete', 'completed', 'completes']],
  ['The proposal was approved ____ the board.', 'by', ['to', 'at', 'on']],
  ['Each of the participants ____ a certificate.', 'receives', ['receive', 'receiving', 'have received']],
  ['We look forward to ____ from you.', 'hearing', ['hear', 'heard', 'be heard']],
  ['The shipment was delayed ____ bad weather.', 'due to', ['because', 'so that', 'although']],
  ['She is the most ____ candidate for the job.', 'qualified', ['qualify', 'qualification', 'qualifies']],
  ['Items can be returned ____ 30 days.', 'within', ['between', 'among', 'above']],
  ['The report must be reviewed ____ it is sent.', 'before', ['during', 'despite', 'unless']],
];
// 토익 듣기: 문제는 방송으로만 나온다. 보기 넷 중 무엇이 맞는지는 들어야 안다.
const TOEIC_LC = ['She is pouring some coffee.', 'They are boarding a bus.', 'A man is fixing a bicycle.', 'Some boxes are stacked on a cart.',
  'He is talking on the phone.', 'The chairs are arranged in a row.', 'A woman is watering plants.', 'People are waiting in line.',
  'He is holding a briefcase.', 'The door has been left open.', 'She is reading a menu.', 'A ladder is leaning against a wall.',
  'They are shaking hands.', 'The shelves are being stocked.', 'A car is parked by the curb.', 'He is typing on a keyboard.'];
const TOEFL = [
  ["The word 'abundant' is closest in meaning to", 'plentiful', ['rare', 'ancient', 'fragile']],
  ["The word 'diminish' is closest in meaning to", 'decrease', ['explain', 'reveal', 'enlarge']],
  ["The word 'feasible' is closest in meaning to", 'possible', ['careless', 'famous', 'hidden']],
  ["The word 'subsequent' is closest in meaning to", 'following', ['previous', 'sudden', 'minor']],
  ["The word 'vital' is closest in meaning to", 'essential', ['optional', 'lively', 'visible']],
  ["The word 'conceal' is closest in meaning to", 'hide', ['reveal', 'build', 'repeat']],
  ["The word 'rigid' is closest in meaning to", 'stiff', ['flexible', 'wet', 'quiet']],
  ["The word 'acquire' is closest in meaning to", 'obtain', ['lose', 'admire', 'require']],
  ["The word 'precise' is closest in meaning to", 'exact', ['vague', 'costly', 'early']],
  ["The word 'enormous' is closest in meaning to", 'huge', ['tiny', 'normal', 'heavy']],
  ["The word 'hostile' is closest in meaning to", 'unfriendly', ['welcoming', 'tired', 'distant']],
  ["The word 'scarce' is closest in meaning to", 'limited', ['frightening', 'common', 'scattered']],
];
const SAT_WORDS = [
  ['Choose the word closest to "meticulous".', 'careful', ['careless', 'quick', 'loud']],
  ['Choose the word closest to "candid".', 'honest', ['sweet', 'hidden', 'nervous']],
  ['Choose the word closest to "benevolent".', 'kind', ['cruel', 'lazy', 'wealthy']],
  ['Choose the word closest to "ephemeral".', 'short-lived', ['eternal', 'heavy', 'colorful']],
  ['Choose the word closest to "pragmatic".', 'practical', ['dreamy', 'angry', 'ancient']],
  ['Choose the word closest to "lucid".', 'clear', ['dark', 'lucky', 'slow']],
];
const HISTORY = [
  ['훈민정음을 창제한 왕은?', '세종', ['태종', '세조', '정조']],
  ['고려를 세운 인물은?', '왕건', ['궁예', '견훤', '이성계']],
  ['조선을 세운 인물은?', '이성계', ['왕건', '이방원', '정몽주']],
  ['임진왜란이 일어난 해는?', '1592년', ['1636년', '1392년', '1910년']],
  ['3·1 운동이 일어난 해는?', '1919년', ['1910년', '1945년', '1905년']],
  ['대한민국 임시정부가 처음 수립된 곳은?', '상하이', ['충칭', '베이징', '도쿄']],
  ['팔만대장경을 보관한 절은?', '해인사', ['불국사', '법주사', '통도사']],
  ['발해를 세운 인물은?', '대조영', ['주몽', '온조', '김춘추']],
  ['광개토대왕은 어느 나라의 왕인가?', '고구려', ['백제', '신라', '가야']],
  ['삼국 통일을 이룬 나라는?', '신라', ['고구려', '백제', '발해']],
  ['백제의 마지막 수도는?', '사비', ['웅진', '한성', '경주']],
  ['6·25 전쟁이 일어난 해는?', '1950년', ['1945년', '1953년', '1960년']],
  ['직지심체요절이 만들어진 시대는?', '고려', ['조선', '통일 신라', '고구려']],
  ['거북선과 관련이 가장 깊은 장군은?', '이순신', ['권율', '강감찬', '을지문덕']],
  ['살수 대첩을 이끈 장군은?', '을지문덕', ['강감찬', '이순신', '김유신']],
  ['귀주 대첩을 이끈 장군은?', '강감찬', ['을지문덕', '서희', '윤관']],
  ['동학 농민 운동이 일어난 해는?', '1894년', ['1919년', '1876년', '1905년']],
  ['강화도 조약이 체결된 해는?', '1876년', ['1894년', '1910년', '1866년']],
  ['경국대전을 완성해 반포한 왕은?', '성종', ['세종', '태조', '영조']],
  ['대동법을 처음 시행한 왕은?', '광해군', ['숙종', '영조', '세종']],
  ['탕평책을 펼친 왕은?', '영조', ['연산군', '광해군', '세조']],
  ['현존하는 세계에서 가장 오래된 금속 활자본은?', '직지심체요절', ['팔만대장경', '훈민정음', '동의보감']],
];
const BIZ = [
  ['SWOT에서 O가 뜻하는 것은?', '기회', ['약점', '위협', '강점']],
  ['마케팅 4P에 들어가지 않는 것은?', '사람(People)', ['제품(Product)', '가격(Price)', '유통(Place)']],
  ['포터의 본원적 경쟁 전략이 아닌 것은?', '수직 계열화', ['원가 우위', '차별화', '집중화']],
  ['BCG 매트릭스에서 점유율은 높고 성장은 낮은 사업은?', '캐시카우', ['스타', '물음표', '개']],
  ['테일러의 과학적 관리법과 관련이 깊은 것은?', '시간·동작 연구', ['호손 실험', '욕구 단계', 'X·Y 이론']],
  ['매슬로의 욕구 단계에서 가장 높은 단계는?', '자아실현 욕구', ['존경 욕구', '안전 욕구', '소속 욕구']],
  ['호손 실험이 강조한 것은?', '인간관계', ['분업', '표준화', '성과급']],
  ['맥그리거가 사람은 일을 싫어한다고 본 이론은?', 'X 이론', ['Y 이론', 'Z 이론', '2요인 이론']],
  ['허즈버그 2요인 이론에서 위생 요인은?', '급여', ['성취감', '인정', '책임감']],
  ['STP에서 T가 뜻하는 것은?', '표적 시장 선정', ['시장 세분화', '포지셔닝', '판매 촉진']],
  ['손익분기점에서 이익은?', '0', ['최대', '음수', '매출과 같음']],
  ['주식회사의 최고 의사결정 기구는?', '주주총회', ['이사회', '감사', '대표이사']],
];
const LAW = [
  ['대한민국 헌법상 대통령의 임기는?', '5년', ['4년', '6년', '7년']],
  ['국회의원의 임기는?', '4년', ['5년', '6년', '3년']],
  ['헌법재판소 재판관의 수는?', '9명', ['7명', '11명', '13명']],
  ['형법상 형사미성년자는 몇 세 미만인가?', '14세', ['12세', '16세', '18세']],
  ['민법상 성년이 되는 나이는?', '19세', ['18세', '20세', '21세']],
  ['죄형법정주의가 금지하는 것은?', '소급 처벌', ['형의 감경', '집행 유예', '선고 유예']],
  ['계약이 성립하려면 필요한 것은?', '청약과 승낙의 합치', ['공증', '등기', '계약금']],
  ['헌법 개정안을 국회가 의결하려면 재적의원 몇 이상이 찬성해야 하나?', '3분의 2', ['과반수', '4분의 3', '5분의 3']],
  ['형벌 중 가장 무거운 것은?', '사형', ['징역', '금고', '벌금']],
  ['부동산 소유권을 넘기려면 필요한 것은?', '등기', ['인도', '공증', '통지']],
  ['대법원장의 임기는?', '6년', ['5년', '4년', '10년']],
  ['정당방위가 인정되면 그 행위는?', '위법성이 없어진다', ['형이 감경된다', '처벌이 유예된다', '벌금형이 된다']],
];
const OXFORD = [
  ['모든 백조가 희다는 주장을 무너뜨리는 것은?', '검은 백조 한 마리', ['흰 백조 백만 마리', '백조 사진', '백조 사전']],
  ['"나는 생각한다, 고로 존재한다"를 말한 사람은?', '데카르트', ['칸트', '흄', '플라톤']],
  ['트롤리 문제가 다루는 것은?', '윤리적 선택', ['물리 법칙', '경제 성장', '언어 습득']],
  ['죄수의 딜레마에서 둘 다 자백하는 까닭은?', '각자 배신이 유리해서', ['서로 믿어서', '법이 그래서', '운이 나빠서']],
  ['오컴의 면도날이 권하는 것은?', '가장 단순한 설명', ['가장 긴 설명', '다수의 의견', '전통적 설명']],
  ['테세우스의 배가 묻는 것은?', '동일성', ['속도', '소유권', '항해술']],
  ['귀납 추론의 약점은?', '다음에도 같다는 보장이 없다', ['너무 짧다', '수학이 필요하다', '항상 틀린다']],
  ['소크라테스 대화법의 핵심은?', '질문으로 모순 드러내기', ['강의로 가르치기', '투표로 정하기', '책 외우기']],
];
const MED = [
  ['인슐린을 만드는 곳은?', '췌장 베타세포', ['간', '신장', '갑상선']],
  ['적혈구가 주로 만들어지는 곳은?', '골수', ['비장', '간', '심장']],
  ['산소를 운반하는 단백질은?', '헤모글로빈', ['인슐린', '콜라겐', '케라틴']],
  ['심장에서 폐로 피를 보내는 곳은?', '우심실', ['좌심실', '우심방', '좌심방']],
  ['비타민 C 결핍증은?', '괴혈병', ['구루병', '각기병', '야맹증']],
  ['비타민 D가 모자라 아이에게 생기는 병은?', '구루병', ['괴혈병', '펠라그라', '빈혈']],
  ['뇌에서 균형을 맡는 곳은?', '소뇌', ['대뇌', '연수', '시상']],
  ['정상 체온에 가장 가까운 것은?', '36.5도', ['34도', '38.5도', '40도']],
  ['항생제가 듣지 않는 것은?', '바이러스', ['세균', '포도상구균', '연쇄상구균']],
  ['페니실린을 발견한 사람은?', '플레밍', ['파스퇴르', '코흐', '제너']],
];
const CFA = [
  ['분산 투자로 줄일 수 있는 위험은?', '비체계적 위험', ['체계적 위험', '시장 위험', '금리 위험']],
  ['베타가 1보다 크면?', '시장보다 더 출렁인다', ['시장보다 덜 출렁인다', '위험이 없다', '배당이 많다']],
  ['금리가 오르면 이미 발행된 채권 가격은?', '내린다', ['오른다', '그대로다', '두 배가 된다']],
  ['72의 법칙으로 연 8% 복리면 원금이 두 배가 되는 데 약 몇 년?', '9년', ['8년', '12년', '6년']],
];
const MBE = [
  ['미국 수정헌법 제1조가 보장하는 것은?', '표현의 자유', ['무기 소지', '배심 재판', '노예 금지']],
  ['미란다 원칙이 알려 주는 권리는?', '묵비권', ['투표권', '재산권', '이주권']],
  ['미국 연방대법관의 임기는?', '종신', ['10년', '6년', '4년']],
  ['이중 위험(double jeopardy) 금지란?', '같은 죄로 두 번 재판 안 함', ['벌금 두 번', '판사 두 명', '두 배 처벌']],
  ['계약의 대가(consideration)란?', '서로 주고받는 가치', ['계약서 종이', '공증 비용', '변호사 보수']],
  ['과실(negligence) 성립 요소가 아닌 것은?', '고의', ['주의 의무', '의무 위반', '손해']],
  ['미국 대통령의 임기는?', '4년', ['5년', '6년', '8년']],
  ['연방 판사를 지명하는 사람은?', '대통령', ['주지사', '하원의장', '국무장관']],
];
const AFTERLIFE = [
  ['저승사자가 쓰는 모자는?', '갓', ['투구', '왕관', '두건']],
  ['저승의 왕으로 알려진 이는?', '염라대왕', ['옥황상제', '용왕', '산신령']],
  ['저승으로 가는 길에 건너는 강은?', '삼도천', ['한강', '은하수', '압록강']],
  ['49재는 사람이 죽은 뒤 며칠째에 지내나?', '49일', ['7일', '100일', '3일']],
  ['저승 명부에 적혀 있다는 것은?', '사람의 수명', ['통장 잔고', '성적', '혈액형']],
  ['이승은 무엇을 뜻하나?', '지금 사는 세상', ['죽은 뒤 세상', '하늘나라', '바닷속']],
  ['저승길에 쓰라고 넣어 주는 돈은?', '노잣돈', ['세뱃돈', '용돈', '축의금']],
];
const MULTILAW = [
  ['평행우주의 나에게 빌린 돈은?', '같은 우주 안에서만 갚는다', ['모든 우주에 갚는다', '갚지 않는다', '이자만 갚는다']],
  ['과거의 나를 만났을 때 금지된 것은?', '악수', ['인사', '눈 맞춤', '사진']],
  ['우주 47번의 헌법 제1조는?', '고양이가 주권자다', ['사람이 주권자다', 'AI가 주권자다', '주권은 없다']],
  ['다중우주 재판의 배심원 수는?', '무한대', ['12명', '9명', '1명']],
  ['시간여행으로 미리 본 판결은?', '증거로 못 쓴다', ['그대로 확정된다', '두 번 집행된다', '항소할 수 없다']],
];
const CUSTOMS = [
  ['FOB 조건에서 해상 운임을 부담하는 쪽은?', '매수인(수입자)', ['매도인(수출자)', '운송인', '세관']],
  ['CIF 가격에 들어가지 않는 것은?', '수입국 관세', ['물품 가격', '해상 운임', '해상 보험료']],
  ['HS 코드에서 세계 공통으로 쓰는 자릿수는?', '6자리', ['4자리', '8자리', '10자리']],
  ['인코텀즈(Incoterms)를 만드는 기관은?', '국제상업회의소(ICC)', ['세계무역기구(WTO)', '세계관세기구(WCO)', '국제통화기금(IMF)']],
  ['선하증권을 뜻하는 약어는?', 'B/L', ['L/C', 'C/O', 'P/L']],
  ['신용장을 뜻하는 약어는?', 'L/C', ['B/L', 'D/A', 'T/T']],
  ['원산지증명서를 뜻하는 약어는?', 'C/O', ['B/L', 'L/G', 'D/P']],
  ['관세의 과세표준은 수입 물품의 무엇인가?', '가격 또는 수량', ['부피', '원산지', '운송 거리']],
  ['수입 물품에 대한 관세를 낼 의무가 있는 사람은 원칙적으로?', '그 물품을 수입신고한 화주', ['운송 회사', '수출자', '보세창고 운영인']],
  ['덤핑방지관세를 매기는 까닭은?', '국내 산업 보호', ['세수 확대', '수출 장려', '환율 안정']],
  ['FTA는 무엇의 줄임말인가?', '자유무역협정', ['관세동맹', '공동시장', '경제동맹']],
  ['외국 물품을 관세를 내지 않은 채 보관할 수 있는 곳은?', '보세구역', ['자유무역항', '면세점 창고', '물류센터']],
];
const APPRAISE = [
  ['감정평가의 3방식에 들지 않는 것은?', '추첨방식', ['원가방식', '비교방식', '수익방식']],
  ['원가법으로 구한 가액을 무엇이라 하나?', '적산가액', ['비준가액', '수익가액', '과세가액']],
  ['거래사례비교법으로 구한 가액은?', '비준가액', ['적산가액', '수익가액', '공시가액']],
  ['수익환원법으로 구한 가액은?', '수익가액', ['적산가액', '비준가액', '보상가액']],
  ['표준지공시지가의 공시기준일은?', '1월 1일', ['3월 1일', '6월 1일', '12월 31일']],
  ['표준지공시지가를 공시하는 사람은?', '국토교통부장관', ['시장·군수·구청장', '기획재정부장관', '한국부동산원장']],
  ['개별공시지가를 결정·공시하는 사람은?', '시장·군수·구청장', ['국토교통부장관', '시·도지사', '감정평가사']],
  ['토지의 위치를 옮길 수 없다는 특성은?', '부동성', ['부증성', '영속성', '개별성']],
  ['토지의 양을 늘릴 수 없다는 특성은?', '부증성', ['부동성', '영속성', '용도의 다양성']],
  ['감정평가에서 원칙으로 삼는 기준가치는?', '시장가치', ['투자가치', '과세가치', '담보가치']],
];
const TRANSFER = [
  ['Choose the word closest to "ubiquitous".', 'omnipresent', ['scarce', 'obscure', 'fragile']],
  ['Choose the word closest to "ameliorate".', 'improve', ['worsen', 'postpone', 'conceal']],
  ['Choose the word closest to "ostensible".', 'apparent', ['hidden', 'costly', 'hostile']],
  ['Choose the word closest to "pernicious".', 'harmful', ['beneficial', 'stubborn', 'generous']],
  ['Choose the word closest to "equivocal".', 'ambiguous', ['equal', 'vocal', 'certain']],
  ['Choose the word closest to "exacerbate".', 'aggravate', ['soothe', 'examine', 'exaggerate']],
  ['Choose the word closest to "taciturn".', 'reserved', ['talkative', 'tactful', 'tense']],
  ['Choose the word closest to "prodigal".', 'wasteful', ['gifted', 'thrifty', 'obedient']],
  ['Choose the word closest to "laconic".', 'concise', ['lazy', 'wordy', 'tearful']],
  ['Choose the word closest to "capricious".', 'fickle', ['spacious', 'steady', 'cautious']],
];
const IBANK = [ // 투자은행 면접 단골 질문
  ['시계가 3시 15분일 때 시침과 분침 사이의 각도는?', '7.5도', ['0도', '15도', '30도']],
  ['하루 동안 시침과 분침이 겹치는 횟수는?', '22번', ['24번', '12번', '23번']],
  ['100명이 서로 한 번씩 악수하면 모두 몇 번?', '4,950번', ['10,000번', '5,050번', '9,900번']],
  ['동전을 세 번 던져 모두 앞면이 나올 확률은?', '1/8', ['1/6', '1/4', '1/3']],
  ['PER 10배, 주당순이익 500원이면 주가는?', '5,000원', ['50원', '500원', '50,000원']],
  ['금리가 오르면 이미 발행된 채권의 가격은?', '내린다', ['오른다', '변하지 않는다', '두 배가 된다']],
  ['EBITDA를 구할 때 영업이익에 다시 더하는 것은?', '감가상각비', ['법인세', '이자 비용', '배당금']],
  ['기업 가치(EV)를 구할 때 시가총액에 더하는 것은?', '순차입금', ['현금', '매출', '영업이익']],
  ['할인율이 오르면 미래 현금흐름의 현재 가치는?', '작아진다', ['커진다', '같다', '0이 된다']],
  ['1부터 100까지 더하면?', '5,050', ['5,000', '4,950', '10,100']],
];
const OPEN_PROBLEMS = ['리만 가설은 참이다', 'P와 NP는 다르다', '모든 짝수는 두 소수의 합이다', '쌍둥이 소수는 끝없이 있다',
  '콜라츠 추측은 참이다', '양-밀스 질량 간극이 있다', '나비에-스토크스 해는 늘 매끄럽다', '호지 추측은 참이다', '버치-스위너턴다이어 추측은 참이다'];
const GRAPES_RED = ['피노 누아', '카베르네 소비뇽', '시라', '메를로', '말벡', '네비올로', '템프라니요', '그르나슈'];
const GRAPES_WHITE = ['샤르도네', '소비뇽 블랑', '리슬링', '슈냉 블랑', '게뷔르츠트라미너'];
const CAPTCHA_ICONS = ['신호등', '자동차', '나무', '버스', '자전거', '소화전'];
const NAMES = ['민수', '지영', '하늘', '도윤', '서연', '준호', '유나', '태민'];

function shuffleChoices(rng, correct, wrongs) {
  const choices = [correct, ...wrongs];
  for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
  return { choices, answer: choices.indexOf(correct) };
}
function pickDistinct(rng, n, k) {
  const out = [];
  while (out.length < k) { const i = Math.floor(rng() * n); if (!out.includes(i)) out.push(i); }
  return out;
}
function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
function numWrongs(rng, ans, cands) {
  const out = [];
  const pool = cands.filter(v => Number.isFinite(v) && v !== ans && v >= 0);
  while (out.length < 3 && pool.length) { const v = pool.splice(Math.floor(rng() * pool.length), 1)[0]; if (!out.includes(v)) out.push(v); }
  let k = 1;
  while (out.length < 3) { const v = ans + k * (k % 2 ? 3 : -3); if (v !== ans && v >= 0 && !out.includes(v)) out.push(v); k++; }
  return out;
}
function numQ(rng, q, ans, cands) {
  const { choices, answer } = shuffleChoices(rng, ans, numWrongs(rng, ans, cands));
  return { kind: 'text', q, choices: choices.map(String), answer, human: true };
}
function poolQ(rng, pool, human = true) {
  const it = pool[Math.floor(rng() * pool.length)];
  const { choices, answer } = shuffleChoices(rng, it[1], it[2]);
  return { kind: 'text', q: it[0], choices, answer, human };
}
const wonText = v => Math.round(v).toLocaleString('ko-KR') + '원';

const GEN = {
  spell(rng) {
    const idx = pickDistinct(rng, SPELL.length, 4);
    const { choices, answer } = shuffleChoices(rng, SPELL[idx[0]][0], idx.slice(1).map(i => SPELL[i][1]));
    return { kind: 'text', q: '다음 중 맞춤법이 바른 것은?', choices, answer, human: true };
  },
  eq(rng, hard) {
    if (rng() < 0.25) {
      const n = ri(rng, hard ? 8 : 5, hard ? 14 : 11), ans = 2 ** n;
      return numQ(rng, `2의 ${n}제곱 = ?`, ans, [ans / 2, ans * 2, 2 * n, ans - 2, ans + 2]);
    }
    const a = ri(rng, 2, 9), x = ri(rng, 2, hard ? 29 : 15), b = ri(rng, 1, 40), c = a * x + b;
    return numQ(rng, `${a}x + ${b} = ${c},  x = ?`, x, [x + 1, x - 1, x + 2, c - b, Math.round(c / a), x + 3]);
  },
  eqhard(rng) { return GEN.eq(rng, true); },
  toeic(rng) { return poolQ(rng, TOEIC); },
  toeicLC(rng) { // 듣기: 글자가 없어 스캔이 안 된다. AI 이어폰이 받아써야 AI 답이 뜬다
    const idx = pickDistinct(rng, TOEIC_LC.length, 4), answer = ri(rng, 0, 3);
    return { kind: 'listen', q: 'Part 1 · 방송을 듣고 사진을 가장 잘 묘사한 것을 고르시오.', choices: idx.map((i, j) => `(${'ABCD'[j]}) ${TOEIC_LC[i]}`), answer, human: false };
  },
  toefl(rng) { return poolQ(rng, TOEFL); },
  sat(rng) {
    if (rng() < 0.5) return poolQ(rng, SAT_WORDS);
    const a = ri(rng, 2, 9), x = ri(rng, 3, 19), b = ri(rng, 1, 30), c = a * x + b;
    return numQ(rng, `If ${a}x + ${b} = ${c}, what is x?`, x, [x + 1, x - 1, x + 2, c - b, x + 3]);
  },
  history(rng) { return poolQ(rng, HISTORY); },
  biz(rng) { return poolQ(rng, BIZ); },
  civil(rng) { return rng() < 0.5 ? GEN.spell(rng) : GEN.history(rng); },
  logic(rng) { // 추리논증: 이웃한 쌍의 비교 세 개로 순서가 하나로 정해진다 (LEET는 지문이 길다)
    const idx = pickDistinct(rng, NAMES.length, 4), p = idx.map(i => NAMES[i]);
    const facts = [[p[0], p[1]], [p[1], p[2]], [p[2], p[3]]];
    for (let i = facts.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [facts[i], facts[j]] = [facts[j], facts[i]]; }
    const tall = rng() < 0.5, ask = Math.floor(rng() * 3);
    const askText = tall ? ['가장 키가 큰 사람은?', '가장 키가 작은 사람은?', '두 번째로 키가 큰 사람은?']
      : ['점수가 가장 높은 사람은?', '점수가 가장 낮은 사람은?', '점수가 두 번째로 높은 사람은?'];
    const ans = ask === 0 ? p[0] : ask === 1 ? p[3] : p[1];
    const q = `${tall ? '키' : '점수'} 비교: ${facts.map(([a, b]) => `${a} > ${b}`).join(', ')}. ${askText[ask]}`;
    const { choices, answer } = shuffleChoices(rng, ans, p.filter(x => x !== ans));
    return { kind: 'text', q, choices, answer, human: true };
  },
  tax(rng) {
    const k = Math.floor(rng() * 4);
    if (k === 0) { const base = ri(rng, 12, 98) * 100000, v = base / 10;
      return { kind: 'text', q: `공급가액 ${wonText(base)}의 부가가치세(10%)는?`, ...shuffleChoices(rng, wonText(v), [wonText(v / 10), wonText(base + v), wonText(base - v)]), human: true }; }
    if (k === 1) { const sales = ri(rng, 9, 30) * 1000000, cost = Math.round(sales * (0.4 + rng() * 0.2) / 100000) * 100000, sga = ri(rng, 5, 25) * 100000, op = sales - cost - sga;
      return { kind: 'text', q: `매출 ${wonText(sales)}, 매출원가 ${wonText(cost)}, 판관비 ${wonText(sga)}일 때 영업이익은?`, ...shuffleChoices(rng, wonText(op), [wonText(sales - cost), wonText(op + sga * 2), wonText(sales - sga)]), human: true }; }
    if (k === 2) { const c = ri(rng, 4, 20) * 1000000, y = [4, 5, 8, 10][ri(rng, 0, 3)], v = c / y;
      return { kind: 'text', q: `취득원가 ${wonText(c)}, 잔존가치 0, 내용연수 ${y}년. 정액법 연 감가상각비는?`, ...shuffleChoices(rng, wonText(v), [wonText(v * 2), wonText(Math.round(c / (y + 1) / 1000) * 1000), wonText(Math.round(v / 2))]), human: true }; }
    const inc = ri(rng, 10, 90) * 100000, v = Math.round(inc * 0.033);
    return { kind: 'text', q: `사업소득 ${wonText(inc)}의 원천징수액(3.3%)은?`, ...shuffleChoices(rng, wonText(v), [wonText(Math.round(inc * 0.0033)), wonText(Math.round(inc * 0.03)), wonText(Math.round(inc * 0.33))]), human: true };
  },
  cpa(rng) {
    const k = Math.floor(rng() * 3);
    if (k === 0) { const cl = ri(rng, 2, 9) * 100, ca = cl * ri(rng, 11, 30) / 10, r = Math.round(ca / cl * 100);
      return numQ(rng, `유동자산 ${ca}억, 유동부채 ${cl}억일 때 유동비율(%)은?`, r, [Math.round(cl / ca * 100), r + 10, r - 10, r + 50]); }
    if (k === 1) { const eq = ri(rng, 2, 10) * 100, ni = eq * ri(rng, 4, 25) / 100, r = Math.round(ni / eq * 100);
      return numQ(rng, `당기순이익 ${ni}억, 자기자본 ${eq}억일 때 ROE(%)는?`, r, [r * 2, r + 5, Math.max(1, r - 3), r + 10]); }
    return GEN.tax(rng);
  },
  law(rng) { return poolQ(rng, LAW); },
  ibank(rng) { return poolQ(rng, IBANK); },
  transfer(rng) { return poolQ(rng, TRANSFER); },
  customs(rng) { return poolQ(rng, CUSTOMS); },
  psat(rng) { return rng() < 0.5 ? GEN.logic(rng) : poolQ(rng, LAW); },
  appraise(rng) {
    if (rng() < 0.3) { const noi = ri(rng, 2, 12) * 1000, cap = [4, 5, 8, 10][ri(rng, 0, 3)], v = noi / cap * 100;
      return numQ(rng, `순영업소득 ${noi}만원, 환원율 ${cap}%일 때 수익가액은 몇 만원?`, v, [noi * cap, v / 10, v * 2, v + noi]); }
    return poolQ(rng, APPRAISE);
  },
  oxford(rng) { return poolQ(rng, OXFORD); },
  med(rng) { return poolQ(rng, MED); },
  cfa(rng) {
    const k = Math.floor(rng() * 3);
    if (k === 0) { const p = ri(rng, 1, 9) * 100, ans = Math.round(p * 1.21);
      return numQ(rng, `원금 ${p}만원을 연 10% 복리로 2년 두면 몇 만원?`, ans, [p * 1.2, p * 1.1, p * 1.3, ans + 1]); }
    if (k === 1) { const sd = [10, 20, 25][ri(rng, 0, 2)], rf = ri(rng, 1, 4), s = [0.2, 0.4, 0.5, 0.8][ri(rng, 0, 3)], rp = rf + s * sd;
      const { choices, answer } = shuffleChoices(rng, String(s), [String(Math.round((s + 0.1) * 10) / 10), String(Math.round(rp / sd * 10) / 10 === s ? s + 0.3 : Math.round(rp / sd * 10) / 10), String(Math.round((s + 0.6) * 10) / 10)]);
      return { kind: 'text', q: `수익률 ${rp}%, 무위험 수익률 ${rf}%, 표준편차 ${sd}%일 때 샤프 비율은?`, choices, answer, human: true }; }
    return poolQ(rng, CFA);
  },
  mbe(rng) { return poolQ(rng, MBE); },
  wine(rng, hard, i) { // 블라인드 테이스팅: 잔 색깔로 레드·화이트는 사람도 가를 수 있다. 품종은 AI 미각 센서가 맞힌다
    const red = rng() < 0.55, mine = red ? GRAPES_RED : GRAPES_WHITE, other = red ? GRAPES_WHITE : GRAPES_RED;
    const a = pickDistinct(rng, mine.length, 2), b = pickDistinct(rng, other.length, 2);
    const { choices, answer } = shuffleChoices(rng, mine[a[0]], [mine[a[1]], other[b[0]], other[b[1]]]);
    return { kind: 'wine', q: `${i + 1}번 잔: 이 와인의 품종은?`, glass: i, color: red ? 'red' : 'white', choices, answer, human: false };
  },
  galaxy(rng) {
    const seed = ri(rng, 100, 99999), choices = [0, 1, 2, 3].map(() => ri(rng, 100, 99999));
    return { kind: 'alien', q: ALIEN_Q[ri(rng, 0, ALIEN_Q.length - 1)], seed, choices, answer: ri(rng, 0, 3), human: false };
  },
  afterlife(rng) { return poolQ(rng, AFTERLIFE); },
  multilaw(rng) { return rng() < 0.5 ? poolQ(rng, MULTILAW, false) : poolQ(rng, LAW); },
  captcha(rng) { // 로봇 확인 퀴즈: 칸을 세면 사람은 맞힌다. AI는 이런 걸 잘 못 맞힌다
    const t = ri(rng, 0, CAPTCHA_ICONS.length - 1), c = ri(rng, 2, 5), grid = [];
    for (let i = 0; i < 9; i++) grid.push(i < c ? t : (t + 1 + ri(rng, 0, CAPTCHA_ICONS.length - 2)) % CAPTCHA_ICONS.length);
    for (let i = grid.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [grid[i], grid[j]] = [grid[j], grid[i]]; }
    const lo = clampN(c - ri(rng, 0, 3), 1, 6), nums = [lo, lo + 1, lo + 2, lo + 3];
    return { kind: 'captcha', q: `${CAPTCHA_ICONS[t]}이(가) 있는 칸은 몇 개?`, grid, target: t, choices: nums.map(n => n + '칸'), answer: nums.indexOf(c), human: true, aiBad: true };
  },
  hle(rng) {
    const idx = pickDistinct(rng, OPEN_PROBLEMS.length, 4);
    const asks = ['다음 중 이 우주에서 참인 것은?', '다음 중 증명이 끝난 것은?', 'Ω가 정답으로 정한 것은?', '다음 중 반례가 없는 것은?'];
    return { kind: 'text', q: asks[ri(rng, 0, asks.length - 1)], choices: idx.map(i => OPEN_PROBLEMS[i]), answer: ri(rng, 0, 3), human: false };
  },
};
function clampN(v, a, b) { return Math.max(a, Math.min(b, v)); }

// 시험 한 교시(또는 모듈·블록)의 문제. 토익은 앞쪽 listen개가 듣기 문항
// 서술형: 보기 없이 모범 답안을 한 줄씩 읽고 옮겨 쓴다 [문제, 답안 네 줄]
const ESSAYS = [
  ['법률유보 원칙의 의미를 서술하시오.', ['행정은 법률에 근거해야 한다.', '국민의 권리를 제한할 때는', '국회가 만든 법률이 필요하다.', '이를 법률유보 원칙이라 한다.']],
  ['정당방위의 성립 요건을 서술하시오.', ['현재의 부당한 침해가 있어야 한다.', '자기나 타인의 법익을 지키려는', '방위 행위여야 하고,', '그 행위에 상당한 이유가 있어야 한다.']],
  ['계약 해제의 효과를 서술하시오.', ['계약은 처음부터 없던 것이 된다.', '각 당사자는 받은 것을 돌려줄', '원상회복 의무를 진다.', '손해가 있으면 배상도 청구할 수 있다.']],
  ['죄형법정주의의 내용을 서술하시오.', ['법률이 없으면 범죄도 없고', '법률이 없으면 형벌도 없다.', '소급해서 처벌할 수 없으며', '유추해석도 금지된다.']],
  ['미란다 원칙의 내용을 서술하시오.', ['체포할 때 피의자에게', '진술을 거부할 수 있다는 것과', '변호인의 도움을 받을 수 있음을', '미리 알려야 한다.']],
  ['소멸시효 제도의 취지를 서술하시오.', ['권리를 오래 행사하지 않으면', '그 권리는 사라진다.', '오래 이어진 사실관계를 존중하고', '증거를 찾기 어려워지기 때문이다.']],
];
function essayQ(rng, n) { const e = ESSAYS[(n + Math.floor(rng() * 2)) % ESSAYS.length]; return { kind: 'essay', q: e[0], lines: e[1], choices: ['', '', '', ''], answer: 0, human: false }; }
function makeQuestions(rng, tier, part = 0) {
  const out = [];
  for (let i = 0; i < tier.qn; i++) {
    const n = part * tier.qn + i;
    if (tier.essay && i === tier.qn - 1) { out.push(essayQ(rng, part)); continue; } // 교시의 마지막 문제는 서술형
    if (tier.listen && n < tier.listen) out.push(GEN.toeicLC(rng));
    else out.push(GEN[tier.gen](rng, false, n));
  }
  return out;
}

// 외계 문자 한 자: 단위 칸 [0,1] 안의 획 목록 [x0,y0,x1,y1] (점은 시작=끝)
function glyph(seed) {
  let s = (seed * 2654435761) >>> 0;
  const r = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return (s >>> 8) / 16777216; };
  const out = [], n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const k = Math.floor(r() * 5);
    if (k === 0) { const x = 0.15 + r() * 0.7; out.push([x, 0.08, x, 0.92]); }
    else if (k === 1) { const y = 0.15 + r() * 0.7; out.push([0.08, y, 0.92, y]); }
    else if (k === 2) out.push(r() < 0.5 ? [0.1, 0.1, 0.9, 0.9] : [0.9, 0.1, 0.1, 0.9]);
    else if (k === 3) { const x = 0.2 + r() * 0.6; out.push([x, 0.2, x, 0.6]); out.push([x, 0.6, x + 0.3 > 0.95 ? x - 0.3 : x + 0.3, 0.6]); }
    else { const x = 0.25 + r() * 0.5, y = 0.25 + r() * 0.5; out.push([x, y, x, y]); }
  }
  return out;
}
function alienWord(seed, len) { const a = []; for (let i = 0; i < len; i++) a.push(seed + i * 17); return a; }

// 감독관 대사 (적발될 때)
const CAUGHT_LINE = {
  homeroom: '"잠깐만, 그 안경 좀 보자."', dean: '"수험생, 그 안경 잠깐 벗어 보세요."', suneung: '"금속탐지기에 반응이 있네요?"',
  agent: '"부정행위로 퇴실 조치합니다."', robot: '"AI가 AI를 못 알아볼 줄 알았나?"', ta: '"교수님, 여기요! 이 학생 안경이..."',
  prof: '"자네, 학점은 포기한 건가?"', teacher: '"Excuse me. Glasses off, please."', cnproctor: '"안경 이리 주세요. 검사합니다."',
  don: '"흥미롭군요. 그 대답은 안경이 한 거죠?"', don2: '"논리적으로, 당신은 방금 걸렸습니다."', judge: '"향이 아니라 렌즈를 맡고 계셨군요."', banker: '"방금 그 답, 본인 생각입니까?"',
  alien: '"삐빅. 반칙 전파 감지."', reaper: '"명부에 커닝도 적혀 있구나."', yeomra: '"이승에서 하던 짓을 여기서도 하느냐!"',
  omega: '"이미 예측했습니다."', webcam: '"응시자분, 화면에서 눈을 떼지 마세요."',
};
const PROCTOR_NAME = { homeroom: '담임', dean: '감독관', suneung: '수능 감독관', agent: '시험 관리관', robot: 'AI 감독관', ta: '조교', prof: '교수님',
  teacher: '미국 선생님', cnproctor: '가오카오 감독관', don: '옥스퍼드 교수', don2: '논리학 교수', judge: '소믈리에 심사위원', banker: '면접관', alien: '외계인', reaper: '저승사자', yeomra: '염라대왕', omega: 'Ω', webcam: '웹캠' };

// 시험마다 다른 장치 이름 (일정표·시작 화면)
const SEC_NAME = { cctv: 'CCTV 회전', pulse: 'AI 탐지 전파', drone: '드론 전파 감시', screen: '화면 검사', alert: '불시 재난문자', emp: 'EMP' };
const MECH_NAME = { peek: '책상 밑 감시', sticker: '단추 스티커', tutorial: '걸려도 혼나고 끝', metal: '입실 금속탐지기', visit: '불시 순시', listen: '듣기 문항', webcam: '웹캠 원격 감독',
  crowd: '다른 수험생', idcheck: '신분 확인 순회', calc: '계산기 검사', long: '긴 지문', sessions: '3교시 연속', adaptive: '적응형 2모듈',
  glasscheck: '안경 물에 담그기', interview: '마주 보는 면접', fatigue: '눈 피로', swap: '블록마다 교대', tasting: '블라인드 테이스팅',
  threeeyes: '세 눈 감독관', float: '무중력', silent: '발소리 없음', teleport: '순간이동', clones: '늘어나는 감독관', human: 'AI 사용 감지', omega: '박자 예측' };

// 장비 효과 문구: lv(그 단계를 가졌을 때)의 효과
const pct = v => Math.round(v * 100) + '%';
const GEAR_TEXT = {
  lens: lv => `스캔 ${scanSecondsAt(lv).toFixed(2)}초 · ${lv >= tune.glass_level ? '시험지 위에 AI 답이 뜸' : lv >= 2 ? '폰 없이 촬영' : lv >= 1 ? '지우개 액정으로 답 확인' : '필통 속 폰으로 답 확인'}${lv >= 7 ? ' · 확신이 높으면 알아서 마킹' : ''}`,
  predict: lv => lv >= 3 ? `후방 카메라: 등 뒤 감독관이 렌즈 위쪽에 보임 · 낌새 +${(lv * tune.predict_bonus).toFixed(2)}초` : lv ? `돌아보는 낌새를 렌즈가 경고 · 낌새 +${(lv * tune.predict_bonus).toFixed(2)}초${lv >= 3 ? ' · 쳐다보면 빨갛게' : ''}` : '감독관이 돌아볼 낌새를 렌즈 가장자리로',
  stealth: lv => `들킬 때 의심도 ${pct(Math.pow(1 - tune.stealth_cut, lv))} · 입실 검사도 덜 걸림`,
  bot: n => `${n}명 · 초당 ${won(botRateAt(n))}원`,
  earbud: lv => '듣기 문항 받아쓰기 · 답을 귓속말로 (마킹은 직접)',
  deepcam: lv => `웹캠 감시 ${pct(gearCut(lv))}`,
  watch: lv => `시험 시간 +${Math.round(lv * tune.watch_bonus)}초`,
  wide: lv => `한 번 스캔에 ${lv + 1}문제`,
  cctvjam: lv => lv >= 3 ? 'CCTV에 안 찍힘' : `CCTV 의심도 ${pct(jamFactor(lv, 3))}`,
  coach: lv => `합격 보상 x${coachMult(lv).toFixed(2)}`,
  autooff: lv => lv >= 2 ? '감독관이 책상 앞에 서면 렌즈 소등 + 스캔 자동 멈춤' : '감독관이 책상 앞에 서면 렌즈 소등',
  jammer: lv => lv >= 3 ? '탐지 전파·드론 완전 차단 · EMP에도 살아남음' : `탐지 전파·드론 ${pct(jamFactor(lv, 3))} · EMP는 못 막음`,
  autoscan: lv => `안 볼 때 알아서 스캔 (반응 ${autoDelayAt(lv).toFixed(2)}초)`,
  glasscase: lv => lv >= 2 ? '물에 담가도 아무 일 없음' : '물에 담가도 켜짐 (잠깐 물방울)',
  gazefix: lv => `마주 보는 시험 의심도 ${pct(1 - lv * tune.gaze_cut)}`,
  eyedrop: lv => `눈 피로 ${pct(gearCut(lv))}`,
  calccover: lv => `계산기 검사 ${pct(gearCut(lv))}`,
  screenfilm: lv => `화면 검사 ${pct(gearCut(lv))}`,
  taste: lv => `테이스팅 AI 정답률 +${Math.round(lv * tune.taste_bonus * 100)}%`,
  thirdeye: lv => `외계인 곁눈질 ${pct(gearCut(lv))}`,
  candle: lv => `저승사자 낌새 +${(lv * tune.candle_bonus).toFixed(1)}초`,
  clone: lv => `평행우주 감독관 ${lv}명 시선 차단`,
  humanmod: lv => `AI 의심도 증가 ${pct(gearCut(lv))}`,
  offbeat: lv => `Ω 박자 예측 ${pct(gearCut(lv))}`,
};
const GEAR_BLURB = {
  lens: '시험지를 찍고 답을 보는 장비. 단추 카메라에서 AI 안경, 그 너머까지', predict: '감독관이 돌아볼 낌새를 알려 주고, 3단계부터는 등 뒤도 보여 준다',
  stealth: '렌즈 빛 반사를 줄여 들켜도 덜 수상하다', bot: '통과한 시험을 대신 쳐서 돈을 번다 (자리 비운 동안에도)',
  earbud: '귓속말로 답을 불러 줘서 시험지를 안 봐도 답을 안다. 방송으로 나오는 문제도 받아쓴다', deepcam: '원격 감독 웹캠에 성실한 내 얼굴을 대신 보여 준다',
  watch: '손목에서 시험 시간을 늘려 주는 수상한 시계', wide: '시야가 넓은 렌즈로 다음 문제까지 한꺼번에 읽는다',
  cctvjam: '교실 CCTV 화면에서 내 자리만 지운다', coach: '합격 뒤 면접에서 귀띔해서 장학금·연봉이 오른다',
  autooff: '감독관이 바로 앞에 오면 렌즈가 알아서 꺼진다', jammer: '탐지 전파와 드론으로부터 내 기기를 숨긴다. 최고 단계는 EMP도 버틴다',
  autoscan: '안경이 감독관 시선을 읽고 혼자 스캔한다', glasscase: '입실 때 안경을 물에 담가도 고장 나지 않는다. 없으면 그 시험 내내 먹통',
  gazefix: '마주 앉은 면접관에게 내 눈이 늘 상대를 보는 것처럼 보이게 한다', eyedrop: '긴 시험에서 눈이 피로해져 스캔이 느려지는 걸 막는다',
  calccover: '승인된 계산기 껍데기를 씌워 검사를 통과한다', screenfilm: '노트북 감시 프로그램에 평범한 화면을 보여 준다',
  taste: '혀에 붙인 센서가 와인 품종을 분석한다', thirdeye: '외계인이 곁눈질하는 방향을 렌즈에 그려 준다',
  candle: '저승사자가 다가오면 촛불이 더 일찍 흔들린다', clone: '평행우주의 내가 늘어난 감독관 시선을 대신 받아 준다',
  humanmod: 'AI 답을 일부러 사람처럼 흐트러뜨린다', offbeat: '스캔 박자를 무작위로 바꿔 Ω의 예측을 피한다',
};
const GEAR_REVIEW = {
  lens: '감독관한테 안 걸렸어요 ★★★★★', predict: '뒤통수에 눈이 생긴 느낌 ★★★★☆', stealth: '반짝임이 하나도 없어요 ★★★★★',
  bot: '봇이 대신 쳐 줌 ★★★☆☆', earbud: '귀에서 정답이 들려요 ★★★★★', deepcam: '감독관이 제 사진만 봤어요 ★★★★☆',
  watch: '시간이 늘어난 기분 ★★★★☆', wide: '한 번에 두 문제씩 ★★★★★', cctvjam: 'CCTV에 제 자리만 비어요 ★★★★★',
  coach: '면접관이 울었어요 ★★★★★', autooff: '불이 알아서 꺼져요 ★★★★☆', jammer: '드론이 그냥 지나감 ★★★★★',
  autoscan: '손 놓고 있어도 됨 ★★★★★', glasscase: '물그릇에서 건져도 켜져요 ★★★★★', gazefix: '교수님이 제 눈빛에 감동 ★★★★★',
  eyedrop: '세 블록 내내 쌩쌩 ★★★★☆', calccover: '계산기 검사 프리패스 ★★★★★', screenfilm: '감시 프로그램이 졸았어요 ★★★★☆',
  taste: '혀가 품종을 말해 줌 ★★★★★', thirdeye: '이마가 좀 간지러움 ★★★★☆', candle: '촛불이 미리 알려 줘요 ★★★★★',
  clone: '나랑 나랑 나랑 ★★★★★', humanmod: '로봇 아니냐는 소리 안 들음 ★★★★☆', offbeat: 'Ω도 못 따라옴 ★★★★★',
  model: '똑똑해졌어요 ★★★★★',
};
