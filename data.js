// PROTOTYPE - NOT FOR PRODUCTION
// Question: 감독관 눈치를 보며 AI 안경으로 스캔하는 긴장감이, 장비와 시험이 함께 커지는 성장과 맞물려 엔딩까지 재밌나?
// Date: 2026-11-17
// 문제 만들기: 시험 종류마다 4지선다를 자동으로 만든다 (정답은 언제나 하나). 대사, 장비 문구, 장치 이름도 여기.
// human: false 인 문제는 사람이 풀 수 없다(외계 문자, 테이스팅, 인류의 마지막 시험). AI 모델이 좋아야 맞힌다.
'use strict';

// 맞춤법: [맞는 말, 틀린 말]. 문맥에 따라 둘 다 맞을 수 있는 짝은 넣지 않는다.
const SPELL = [
  ['어쭙잖다', '어줍잖다'], ['설렘', '설레임'], ['널찍하다', '넓직하다'], ['닦달', '닥달'], ['괜스레', '괜시리'],
  ['뒤치다꺼리', '뒤치닥거리'], ['삼가다', '삼가하다'], ['되뇌다', '되뇌이다'], ['추스르다', '추스리다'], ['욱여넣다', '우겨넣다'],
  ['눈살', '눈쌀'], ['내로라하다', '내노라하다'], ['통째로', '통채로'], ['으레', '으례'], ['켕기다', '캥기다'],
  ['허투루', '허투로'], ['치르다', '치루다'], ['잠그다', '잠구다'], ['담그다', '담구다'], ['구레나룻', '구렛나루'],
  ['껍질째', '껍질채'], ['늘그막', '늙으막'], ['움큼', '웅큼'], ['짜깁기', '짜집기'], ['희한하다', '희안하다'],
  ['얽히고설키다', '얼키고설키다'], ['핼쑥하다', '핼쓱하다'], ['곱빼기', '곱배기'], ['뇌졸중', '뇌졸증'], ['덤터기', '덤태기'],
  ['메슥거리다', '미식거리다'], ['아등바등', '아둥바둥'], ['빈털터리', '빈털털이'], ['안절부절못하다', '안절부절하다'], ['개수', '갯수'],
  ['해님', '햇님'], ['머리말', '머릿말'], ['인사말', '인삿말'], ['전셋집', '전세집'], ['마구간', '마굿간'],
  ['초점', '촛점'], ['대가', '댓가'], ['겸연쩍다', '겸연적다'], ['숙맥', '쑥맥'], ['일사불란', '일사분란'],
  ['풍비박산', '풍지박산'], ['절체절명', '절대절명'], ['동고동락', '동거동락'], ['야반도주', '야밤도주'], ['성대모사', '성대묘사'],
];

const ALIEN_Q = ['다음 중 가장 무거운 별은?', '블랙홀의 맛으로 옳은 것은?', '은하 3번 국도의 제한 속도는?',
  '외계 급식 중 가장 매운 것은?', '토성 고리를 세는 단위는?', '지구인의 주식(主食)은?', '혜성의 꼬리는 몇 개인가?',
  '빛보다 빠른 것을 고르시오.', '안드로메다로 가는 버스 번호는?', '우주 화장실 사용법으로 옳은 것은?'];

// 4지선다 문제 묶음: [문제, 정답, 오답 3개]
const TOEIC = [
  ['Had the shipment arrived on time, we ____ the deadline.', 'would have met', ['would meet', 'will have met', 'had met']],
  ['The manager insisted that every invoice ____ before noon.', 'be approved', ['is approved', 'approves', 'was approving']],
  ['The software is ____ of processing 10,000 orders per hour.', 'capable', ['able', 'possible', 'competent']],
  ['Sales rose sharply, ____ exceeding the quarterly forecast.', 'thereby', ['whereas', 'otherwise', 'nevertheless']],
  ['Mr. Ito, ____ proposal was accepted, will lead the project.', 'whose', ['who', 'whom', 'which']],
  ['Employees are entitled ____ fifteen days of paid leave.', 'to', ['for', 'with', 'of']],
  ['Not until the audit was complete ____ the error.', 'did they notice', ['they noticed', 'they did notice', 'noticed they']],
  ['The warranty does not cover damage ____ from misuse.', 'resulting', ['resulted', 'results', 'to result']],
  ['Ms. Park is accustomed to ____ with overseas clients.', 'dealing', ['deal', 'dealt', 'be dealt']],
  ['The more feedback we collect, ____ our service becomes.', 'the better', ['better', 'the best', 'more better']],
  ['The seminar was canceled ____ low enrollment.', 'owing to', ['because', 'despite', 'in case']],
  ['By the time the CEO arrives, the team ____ the slides.', 'will have finished', ['finished', 'has finished', 'will finishing']],
  ['The data must be kept strictly ____.', 'confidential', ['confident', 'confidentially', 'confidence']],
  ['Rarely ____ such a rapid increase in demand.', 'have we seen', ['we have seen', 'we saw', 'did we saw']],
  ['The committee is looking forward to ____ your proposal.', 'reviewing', ['review', 'reviewed', 'be reviewed']],
  ['It is imperative that the client ____ informed immediately.', 'be', ['is', 'was', 'being']],
  ['The building, ____ in 1920, is now a museum.', 'constructed', ['constructing', 'was constructed', 'constructs']],
  ['Please refrain ____ using mobile phones during the session.', 'from', ['to', 'of', 'against']],
  ['Neither the director nor the managers ____ aware of the change.', 'were', ['was', 'is', 'has been']],
  ['Hardly had the meeting begun ____ the fire alarm rang.', 'when', ['than', 'then', 'that']],
  ['The refund will be processed ____ receipt of the returned item.', 'upon', ['while', 'during', 'among']],
  ['She would rather ____ the report today than delay it.', 'finish', ['to finish', 'finishing', 'finished']],
];
// 토익 듣기: 문제는 방송으로만 나온다. 보기 넷 중 무엇이 맞는지는 들어야 안다.
const TOEIC_LC = ['She is pouring some coffee.', 'They are boarding a bus.', 'A man is fixing a bicycle.', 'Some boxes are stacked on a cart.',
  'He is talking on the phone.', 'The chairs are arranged in a row.', 'A woman is watering plants.', 'People are waiting in line.',
  'He is holding a briefcase.', 'The door has been left open.', 'She is reading a menu.', 'A ladder is leaning against a wall.',
  'They are shaking hands.', 'The shelves are being stocked.', 'A car is parked by the curb.', 'He is typing on a keyboard.'];
const TOEFL = [
  ['"attenuate" in the passage is closest in meaning to', 'weaken', ['amplify', 'lengthen', 'attend']],
  ['"corroborate" in the passage is closest in meaning to', 'confirm', ['refute', 'collaborate', 'corrode']],
  ['"anomalous" in the passage is closest in meaning to', 'irregular', ['typical', 'anonymous', 'harmful']],
  ['"paucity" in the passage is closest in meaning to', 'scarcity', ['abundance', 'delay', 'purity']],
  ['"precipitate" (verb) in the passage is closest in meaning to', 'trigger', ['prevent', 'soften', 'predict']],
  ['"disseminate" in the passage is closest in meaning to', 'spread', ['conceal', 'dismantle', 'imitate']],
  ['"inexorable" in the passage is closest in meaning to', 'unstoppable', ['avoidable', 'inexplicable', 'gradual']],
  ['"vestige" in the passage is closest in meaning to', 'trace', ['garment', 'origin', 'summit']],
  ['"ameliorate" in the passage is closest in meaning to', 'improve', ['worsen', 'postpone', 'conceal']],
  ['"tenable" in the passage is closest in meaning to', 'defensible', ['fragile', 'temporary', 'tenth']],
  ['"burgeoning" in the passage is closest in meaning to', 'rapidly growing', ['slowly fading', 'heavily taxed', 'newly buried']],
  ['"salient" in the passage is closest in meaning to', 'prominent', ['salty', 'hidden', 'silent']],
  ['"ostensibly" in the passage is closest in meaning to', 'apparently', ['secretly', 'costly', 'rarely']],
  ['"eschew" in the passage is closest in meaning to', 'avoid', ['chew', 'embrace', 'repeat']],
  ['"profligate" in the passage is closest in meaning to', 'wasteful', ['frugal', 'prolific', 'profound']],
  ['"stratum" in the passage is closest in meaning to', 'layer', ['strategy', 'summit', 'current']],
];
const SAT_WORDS = [
  ['Choose the word closest to "ambivalent".', 'conflicted', ['certain', 'hostile', 'generous']],
  ['Choose the word closest to "cogent".', 'convincing', ['vague', 'lengthy', 'gentle']],
  ['Choose the word closest to "disparate".', 'distinct', ['similar', 'desperate', 'sparse']],
  ['Choose the word closest to "frivolous".', 'trivial', ['serious', 'frozen', 'fragile']],
  ['Choose the word closest to "gregarious".', 'sociable', ['solitary', 'greedy', 'grateful']],
  ['Choose the word closest to "impetuous".', 'rash', ['cautious', 'imperial', 'important']],
  ['Choose the word closest to "lethargic".', 'sluggish', ['energetic', 'lethal', 'legal']],
  ['Choose the word closest to "placate".', 'soothe', ['provoke', 'relocate', 'imitate']],
  ['Choose the word closest to "tenacious".', 'persistent', ['fragile', 'tentative', 'tense']],
  ['Choose the word closest to "venerate".', 'revere', ['despise', 'ventilate', 'generate']],
  ['Choose the word closest to "zealous".', 'fervent', ['apathetic', 'jealous', 'lazy']],
  ['Choose the word closest to "esoteric".', 'obscure', ['popular', 'external', 'historic']],
  ['Choose the word closest to "novel" (adjective).', 'original', ['fictional', 'ancient', 'lengthy']],
  ['Choose the word closest to "meticulous".', 'painstaking', ['careless', 'metallic', 'timid']],
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
  ['헌법 개정안의 국회 의결 정족수는?', '재적 3분의 2 이상 찬성', ['재적 과반수 찬성', '출석 3분의 2 찬성', '재적 5분의 3 찬성']],
  ['대통령 탄핵소추의 국회 의결 정족수는?', '재적 3분의 2 이상', ['재적 과반수', '재적 3분의 1', '출석 3분의 2']],
  ['헌법재판소 위헌 결정에 필요한 재판관 수는?', '6명 이상', ['5명 이상', '7명 이상', '9명 전원']],
  ['민법상 일반 채권의 소멸시효는?', '10년', ['3년', '5년', '20년']],
  ['상사채권의 소멸시효는?', '5년', ['3년', '10년', '1년']],
  ['민법상 성년이 되는 나이는?', '만 19세', ['만 18세', '만 20세', '만 21세']],
  ['부동산 점유취득시효 기간은?', '20년', ['10년', '5년', '30년']],
  ['부동산 등기부취득시효 기간은?', '10년', ['20년', '5년', '3년']],
  ['민법상 법정이율은?', '연 5%', ['연 6%', '연 3%', '연 12%']],
  ['상법상 법정이율은?', '연 6%', ['연 5%', '연 12%', '연 3%']],
  ['형사 미성년자의 기준은?', '14세 미만', ['13세 미만', '12세 미만', '16세 미만']],
  ['불법행위 손해배상청구권은 손해와 가해자를 안 날부터?', '3년', ['1년', '5년', '10년']],
  ['국회 임시회 소집 요구에 필요한 재적의원 수는?', '4분의 1 이상', ['3분의 1 이상', '5분의 1 이상', '과반수']],
  ['대통령 선거에 나갈 수 있는 나이는?', '40세 이상', ['35세 이상', '45세 이상', '30세 이상']],
  ['대법원장의 임기는?', '6년, 중임 불가', ['6년, 연임 가능', '4년, 중임 불가', '10년, 단임']],
  ['헌법재판소장을 임명하는 절차는?', '국회 동의 후 대통령 임명', ['대법원장 지명', '국회 선출', '재판관 호선']],
  ['계약금만 준 매수인이 계약을 해제하려면?', '계약금 포기', ['계약금 두 배 반환', '위약금 세 배', '해제 불가']],
  ['직계비속의 유류분은 법정상속분의?', '2분의 1', ['3분의 1', '4분의 1', '3분의 2']],
  ['배우자의 법정상속분은 직계비속 한 명의 몇 배?', '1.5배', ['1배', '2배', '0.5배']],
  ['민사 항소 기간은 판결서를 송달받은 날부터?', '2주', ['1주', '3주', '30일']],
  ['형사 항소 기간은 판결 선고일부터?', '7일', ['14일', '10일', '30일']],
  ['체포한 피의자의 구속영장은 몇 시간 안에 청구하나?', '48시간', ['24시간', '72시간', '36시간']],
  ['주주총회 특별결의는 출석 의결권의?', '3분의 2 이상', ['과반수', '4분의 3 이상', '전원']],
  ['주식회사 이사의 임기 상한은?', '3년', ['2년', '4년', '5년']],
  ['취소권은 추인할 수 있는 날부터 몇 년 안에 행사하나?', '3년', ['1년', '5년', '10년']],
  ['채권자취소권은 취소 원인을 안 날부터?', '1년', ['3년', '5년', '6개월']],
  ['국회의 계엄 해제 요구 정족수는?', '재적 과반수 찬성', ['재적 3분의 2', '출석 과반수', '재적 3분의 1']],
  ['대통령이 거부한 법률안의 재의결 요건(출석 의원 기준)은?', '3분의 2 이상 찬성', ['과반수 찬성', '4분의 3 이상 찬성', '전원 찬성']],
];
const OXFORD = [
  ['"실존은 본질에 앞선다"고 말한 사람은?', '사르트르', ['하이데거', '카뮈', '키르케고르']],
  ['정언명령을 내세운 철학자는?', '칸트', ['밀', '벤담', '흄']],
  ['"무지의 베일"을 제안한 사람은?', '롤스', ['노직', '샌델', '로크']],
  ['반증 가능성을 과학의 기준으로 본 사람은?', '포퍼', ['쿤', '라카토슈', '파이어아벤트']],
  ['패러다임 전환을 말한 사람은?', '쿤', ['포퍼', '콰인', '카르납']],
  ['"중국어 방" 논증을 내놓은 사람은?', '설', ['튜링', '데닛', '차머스']],
  ['의식의 "어려운 문제"라는 이름을 붙인 사람은?', '차머스', ['설', '네이글', '데닛']],
  ['"박쥐가 된다는 것은 어떤 것인가"를 쓴 사람은?', '네이글', ['차머스', '퍼트넘', '크립키']],
  ['게티어 문제가 반박한 지식의 정의는?', '정당화된 참인 믿음', ['경험된 사실', '다수의 합의', '유용한 믿음']],
  ['흄이 의심한 것은?', '인과의 필연성', ['수학의 확실성', '감각의 존재', '언어의 의미']],
  ['"경험 기계" 사고 실험을 내놓은 사람은?', '노직', ['롤스', '싱어', '파핏']],
  ['괴델의 불완전성 정리가 말하는 것은?', '증명 못 하는 참인 명제가 있다', ['모든 명제는 증명된다', '수학은 모순이다', '무한은 없다']],
  ['"언어의 한계가 세계의 한계"라고 쓴 사람은?', '비트겐슈타인', ['러셀', '프레게', '촘스키']],
  ['테세우스의 배가 묻는 것은?', '동일성', ['인과', '자유의지', '정의']],
];
const MED = [
  ['해당과정의 속도를 조절하는 핵심 효소는?', 'PFK-1', ['헥소키네이스', '피루브산 키네이스', '알돌레이스']],
  ['TCA 회로가 일어나는 곳은?', '미토콘드리아 기질', ['세포질', '막 사이 공간', '소포체']],
  ['포도당 한 분자가 해당과정에서 내는 순 ATP는?', '2개', ['4개', '36개', '1개']],
  ['사구체 여과액이 가장 많이 재흡수되는 곳은?', '근위세뇨관', ['헨레고리', '원위세뇨관', '집합관']],
  ['항이뇨호르몬(ADH)이 주로 작용하는 곳은?', '집합관', ['근위세뇨관', '사구체', '헨레고리 상행지']],
  ['심전도에서 심실 탈분극을 나타내는 것은?', 'QRS파', ['P파', 'T파', 'U파']],
  ['동방결절이 있는 곳은?', '우심방', ['좌심방', '우심실', '심실중격']],
  ['비타민 K 의존 응고인자가 아닌 것은?', '제8인자', ['제2인자', '제7인자', '제10인자']],
  ['와파린의 효과를 보는 검사는?', 'PT(INR)', ['aPTT', '출혈시간', '혈소판 수']],
  ['헤파린의 효과를 보는 검사는?', 'aPTT', ['PT(INR)', '출혈시간', 'D-dimer']],
  ['DNA 복제에서 RNA 프라이머를 만드는 효소는?', '프라이메이스', ['헬리케이스', '라이게이스', '토포아이소머레이스']],
  ['오카자키 절편을 잇는 효소는?', 'DNA 라이게이스', ['프라이메이스', '헬리케이스', 'DNA 중합효소 III']],
  ['번역 개시 코돈은?', 'AUG', ['UAA', 'UAG', 'UGA']],
  ['다음 중 종결 코돈이 아닌 것은?', 'UGG', ['UAA', 'UAG', 'UGA']],
  ['부교감신경 절후 섬유의 신경전달물질은?', '아세틸콜린', ['노르에피네프린', '도파민', '세로토닌']],
  ['칼시토닌을 분비하는 세포는?', '갑상선 C세포', ['부갑상선 주세포', '췌장 알파세포', '부신 수질세포']],
  ['알도스테론이 분비되는 부신 피질 층은?', '사구대', ['속상대', '망상대', '수질']],
  ['코르티솔이 분비되는 부신 피질 층은?', '속상대', ['사구대', '망상대', '수질']],
  ['산소 해리 곡선을 오른쪽으로 옮기는 것은?', 'pH 감소', ['체온 저하', '2,3-BPG 감소', 'CO2 감소']],
  ['폐 계면활성제를 만드는 세포는?', '제2형 폐포세포', ['제1형 폐포세포', '술잔세포', '폐포 대식세포']],
  ['위에서 내인자를 분비하는 세포는?', '벽세포', ['주세포', 'G세포', '점액세포']],
  ['펩시노겐을 분비하는 세포는?', '주세포', ['벽세포', 'G세포', 'D세포']],
  ['겸상 적혈구 빈혈의 유전 방식은?', '상염색체 열성', ['상염색체 우성', 'X 연관 열성', '미토콘드리아 유전']],
  ['헌팅턴병의 유전 방식은?', '상염색체 우성', ['상염색체 열성', 'X 연관 열성', 'X 연관 우성']],
  ['혈우병 A에서 부족한 응고인자는?', '제8인자', ['제9인자', '제7인자', '제11인자']],
  ['페니실린이 막는 것은?', '세포벽 합성', ['단백질 합성', 'DNA 복제', '엽산 합성']],
  ['태반을 통과하는 항체는?', 'IgG', ['IgM', 'IgA', 'IgE']],
  ['1차 면역 반응에서 가장 먼저 나오는 항체는?', 'IgM', ['IgG', 'IgA', 'IgD']],
  ['미주신경은 몇 번 뇌신경인가?', '10번', ['7번', '9번', '11번']],
  ['안면신경은 몇 번 뇌신경인가?', '7번', ['5번', '8번', '10번']],
];
const CFA = [
  ['분산 투자로 줄일 수 있는 위험은?', '비체계적 위험', ['체계적 위험', '시장 위험', '금리 위험']],
  ['CAPM에서 보상받는 위험은?', '체계적 위험', ['비체계적 위험', '기업 고유 위험', '총위험']],
  ['준강형 효율적 시장이 가격에 반영하는 정보는?', '모든 공개 정보', ['과거 가격만', '내부 정보까지', '거래량만']],
  ['콜옵션 매수자의 최대 손실은?', '옵션 프리미엄', ['무한대', '행사가격', '기초자산 가격']],
  ['풋-콜 패리티에서 C + PV(X)와 같은 것은?', 'P + S', ['P - S', 'S - P', 'P + X']],
  ['GIPS는 무엇에 관한 기준인가?', '투자 성과 공시', ['회계 감사', '신용 평가', '자금 세탁 방지']],
  ['트레이너 비율의 분모는?', '베타', ['표준편차', '추적 오차', '분산']],
  ['정보 비율의 분모는?', '추적 오차', ['베타', '표준편차', '무위험 수익률']],
  ['95% VaR가 뜻하는 것은?', '5% 확률로 그보다 큰 손실', ['95% 확률로 그만큼 손실', '평균 손실', '최대 손실']],
  ['72의 법칙으로 연 8% 복리면 원금이 두 배가 되는 데 약?', '9년', ['8년', '12년', '6년']],
  ['수익률 곡선이 역전되면 흔히 무엇을 예고하나?', '경기 침체', ['물가 급등', '증시 과열', '환율 안정']],
  ['베타가 1보다 큰 주식은?', '시장보다 더 출렁인다', ['시장보다 덜 출렁인다', '위험이 없다', '배당이 많다']],
];
const MBE = [
  ['연방 다양성 관할의 소가 기준은?', '75,000달러 초과', ['50,000달러 초과', '100,000달러 초과', '10,000달러 초과']],
  ['미란다 고지가 필요한 상황은?', '구금 상태의 신문', ['모든 체포', '교통 단속', '법정 증언']],
  ['수정헌법 제4조가 금지하는 것은?', '부당한 수색·압수', ['자기부죄 강요', '잔혹한 형벌', '이중 위험']],
  ['수정헌법 제5조에 없는 것은?', '변호인의 조력', ['자기부죄 거부', '이중 위험 금지', '적법 절차']],
  ['수정헌법 제6조가 보장하는 것은?', '신속한 공개 재판', ['무기 소지', '표현의 자유', '부당한 수색 금지']],
  ['수정헌법 제8조가 금지하는 것은?', '잔혹하고 이례적인 형벌', ['부당한 수색', '군인의 민가 숙영', '국교 수립']],
  ['엄격 심사가 적용되는 구분은?', '인종', ['성별', '나이', '소득']],
  ['성별 구분에 적용되는 심사 기준은?', '중간 심사', ['엄격 심사', '합리성 심사', '심사 없음']],
  ['사기방지법(Statute of Frauds) 대상이 아닌 것은?', '6개월짜리 용역 계약', ['토지 매매', '1년 넘게 걸리는 계약', '500달러 이상 물품 매매']],
  ['UCC 제2편이 적용되는 계약은?', '물품 매매', ['부동산 매매', '고용', '용역']],
  ['전문증거(hearsay)란?', '법정 밖 진술로 그 내용을 증명', ['증인의 직접 목격', '전문가 의견', '물적 증거']],
  ['가장 완전한 부동산 소유권은?', 'fee simple absolute', ['life estate', 'fee tail', 'leasehold']],
  ['역점유(adverse possession) 요건이 아닌 것은?', '소유자의 동의', ['공연한 점유', '계속된 점유', '적대적 점유']],
  ['중범죄 살인 규칙(felony murder)이란?', '중범죄 중 생긴 사망은 살인', ['계획 살인만 살인', '과실치사의 다른 이름', '공범은 면책']],
  ['res ipsa loquitur의 뜻은?', '사실 자체가 과실을 말한다', ['피해자가 증명한다', '고의를 추정한다', '손해가 없다']],
  ['비교 과실(comparative negligence)이란?', '과실 비율만큼 배상 감액', ['피해자 과실이면 배상 없음', '가해자 전액 배상', '보험사 책임']],
  ['연방 대법원 대법관 수는?', '9명', ['7명', '11명', '12명']],
  ['헌법 수정안 비준에 필요한 주의 비율은?', '4분의 3', ['3분의 2', '과반수', '5분의 3']],
  ['대통령 거부권을 뒤집는 데 필요한 것은?', '양원 각 3분의 2', ['양원 과반수', '상원 5분의 3', '하원 4분의 3']],
  ['조약 비준에 필요한 상원 동의는?', '3분의 2', ['과반수', '5분의 3', '4분의 3']],
  ['형사 재판의 증명 기준은?', '합리적 의심 없는 증명', ['증거의 우세', '명백하고 확실한 증거', '상당한 이유']],
  ['민사 재판의 일반 증명 기준은?', '증거의 우세', ['합리적 의심 없는 증명', '상당한 이유', '합리적 의심']],
  ['독수독과 원칙이란?', '위법 증거의 파생 증거도 배제', ['자백만 배제', '전문증거 배제', '증인 격리']],
  ['Erie 원칙: 다양성 사건에 적용하는 실체법은?', '주 법', ['연방 보통법', '국제법', '판사 재량']],
];
const AFTERLIFE = [
  ['저승의 시왕은 모두 몇 명인가?', '10명', ['7명', '9명', '12명']],
  ['염라대왕은 시왕 가운데 몇 번째인가?', '다섯 번째', ['첫 번째', '세 번째', '열 번째']],
  ['죽은 이의 죄를 비추는 거울은?', '업경대', ['명경지수', '청동거울', '만파식적']],
  ['지옥 중생을 구하겠다고 서원한 보살은?', '지장보살', ['관세음보살', '문수보살', '미륵보살']],
  ['저승으로 가는 길에 건너는 강은?', '삼도천', ['황하', '은하수', '요단강']],
  ['49재는 어떻게 지내나?', '7일마다 7번', ['10일마다 5번', '3일마다 16번', '49일째에 1번']],
  ['저승길에 쓰라고 넣어 주는 돈은?', '노잣돈', ['세뱃돈', '축의금', '부조금']],
  ['그리스 신화에서 저승의 강을 건네주는 뱃사공은?', '카론', ['하데스', '케르베로스', '타나토스']],
  ['그 뱃삯으로 죽은 이의 입에 물리던 동전은?', '오볼로스', ['드라크마', '데나리우스', '탈란트']],
  ['이집트 신화에서 죽은 이의 심장과 함께 저울에 다는 것은?', '마트의 깃털', ['오시리스의 왕관', '호루스의 눈', '금 한 덩이']],
  ['바리데기가 부모를 살리려고 구하러 간 것은?', '약수', ['불로초', '여의주', '천도복숭아']],
  ['차사본풀이에서 강림이 잡으러 간 이는?', '염라대왕', ['옥황상제', '저승사자', '삼신할미']],
  ['저승사자가 쓰는 모자는?', '갓', ['투구', '왕관', '두건']],
  ['저승 명부에 적혀 있다는 것은?', '사람의 수명', ['통장 잔고', '성적', '혈액형']],
];
const MULTILAW = [
  ['평행우주의 나에게 빌린 돈은?', '같은 우주 안에서만 갚는다', ['모든 우주에 갚는다', '갚지 않는다', '이자만 갚는다']],
  ['과거의 나를 만났을 때 금지된 것은?', '악수', ['인사', '눈 맞춤', '사진']],
  ['우주 47번의 헌법 제1조는?', '고양이가 주권자다', ['사람이 주권자다', 'AI가 주권자다', '주권은 없다']],
  ['다중우주 재판의 배심원 수는?', '무한대', ['12명', '9명', '1명']],
  ['시간여행으로 미리 본 판결은?', '증거로 못 쓴다', ['그대로 확정된다', '두 번 집행된다', '항소할 수 없다']],
  ['평행우주의 내가 지은 죄의 책임은?', '그 우주의 나만 진다', ['모든 내가 나눠 진다', '가장 가까운 우주의 내가 진다', '아무도 안 진다']],
  ['우주 간 계약서에 꼭 적어야 하는 것은?', '우주 번호', ['혈액형', '별자리', '중력 상수']],
  ['갈라진 우주의 재산은 누구 것인가?', '갈라질 때 복제된다', ['원본 우주의 것', '먼저 등기한 쪽', '국고 귀속']],
  ['슈뢰딩거 유언장의 효력은?', '열기 전까지 유효이자 무효', ['항상 유효', '항상 무효', '상자가 정한다']],
  ['시간여행자의 공소시효는?', '본인이 겪은 시간으로 센다', ['달력으로 센다', '정지된다', '없다']],
  ['다중우주 법원의 관할은?', '사건이 관측된 우주', ['피고가 사는 우주', '원고가 고른 우주', '가장 큰 우주']],
  ['과거의 나를 증인으로 부를 때 필요한 것은?', '미래의 나의 동의', ['과거의 나의 서명', '부모의 동의', '시계 압수']],
];
const CUSTOMS = [
  ['관세의 과세물건이 확정되는 때는 원칙적으로?', '수입신고를 하는 때', ['선적하는 때', '입항하는 때', '대금을 치르는 때']],
  ['관세 부과의 제척기간은 원칙적으로?', '5년', ['3년', '7년', '10년']],
  ['5억 원 미만 관세 징수권의 소멸시효는?', '5년', ['3년', '10년', '7년']],
  ['관세 과세가격 결정의 제1방법은?', '해당 물품의 거래가격', ['동종·동질물품 가격', '국내 판매가격', '산정가격']],
  ['FOB 조건에서 위험이 넘어가는 때는?', '본선에 적재한 때', ['공장에서 인도한 때', '도착항에 내린 때', '수입 통관한 때']],
  ['CIF 가격에 들어가지 않는 것은?', '수입국 관세', ['운임', '보험료', '물품 원가']],
  ['HS 코드에서 국제 공통인 자릿수는?', '6자리', ['4자리', '8자리', '10자리']],
  ['한국의 HSK는 몇 자리인가?', '10자리', ['6자리', '8자리', '12자리']],
  ['세번변경기준이란?', 'HS 번호가 바뀌면 원산지 인정', ['부가가치 40% 이상', '최종 포장한 나라', '선적한 나라']],
  ['관세 환급 청구권의 소멸시효는?', '5년', ['1년', '3년', '10년']],
  ['DDP 조건에서 수입 관세를 내는 쪽은?', '매도인', ['매수인', '운송인', '보험사']],
  ['EXW 조건에서 수출 통관을 맡는 쪽은?', '매수인', ['매도인', '운송인', '세관']],
  ['간이세율을 적용하는 대표적인 물품은?', '여행자 휴대품', ['대량 원자재', '수출 물품', '보세 운송품']],
  ['여행자 휴대품의 기본 면세 한도는?', '미화 800달러', ['미화 600달러', '미화 400달러', '미화 1,000달러']],
  ['선하증권(B/L)의 성격이 아닌 것은?', '보험 증권', ['화물 수령증', '운송계약의 증빙', '권리 증권']],
  ['신용장 거래에서 대금 지급을 약속하는 곳은?', '개설은행', ['통지은행', '수출자', '선사']],
  ['관세는 납세신고가 수리된 날부터 며칠 안에 내나?', '15일', ['7일', '30일', '10일']],
  ['과세가격에 더하는 요소가 아닌 것은?', '수입 뒤 국내 운송비', ['중개료', '포장비', '권리 사용료']],
  ['덤핑방지관세를 매기는 기준 가격은?', '정상가격', ['국내 최고가', '수출국 최저가', '국제 평균가']],
  ['관세법상 반송이란?', '외국물품을 그대로 외국으로 반출', ['수입한 물품을 다시 수출', '세관의 압수', '보세구역 사이 이동']],
];
const APPRAISE = [
  ['원가법으로 구한 가액의 이름은?', '적산가액', ['비준가액', '수익가액', '유추가액']],
  ['거래사례비교법으로 구한 가액의 이름은?', '비준가액', ['적산가액', '수익가액', '공시가액']],
  ['표준지공시지가의 공시 기준일은?', '1월 1일', ['6월 1일', '7월 1일', '12월 31일']],
  ['표준지공시지가를 공시하는 주체는?', '국토교통부장관', ['시장·군수·구청장', '한국부동산원장', '기획재정부장관']],
  ['개별공시지가를 결정·공시하는 주체는?', '시장·군수·구청장', ['국토교통부장관', '감정평가사협회', '시·도지사']],
  ['토지 감정평가의 원칙적 방법은?', '공시지가기준법', ['원가법', '수익환원법', '거래사례비교법']],
  ['건물 감정평가의 원칙적 방법은?', '원가법', ['공시지가기준법', '수익환원법', '거래사례비교법']],
  ['임대료 감정평가의 원칙적 방법은?', '임대사례비교법', ['적산법', '수익분석법', '원가법']],
  ['위치에 따라 지대가 달라진다고 본 학자는?', '튀넨', ['리카도', '마르크스', '마셜']],
  ['비옥도 차이로 지대를 설명한 이론은?', '차액지대설', ['절대지대설', '입찰지대설', '독점지대설']],
  ['도시 구조의 동심원 이론을 내놓은 학자는?', '버제스', ['호이트', '해리스', '알론소']],
  ['도시 구조의 선형 이론을 내놓은 학자는?', '호이트', ['버제스', '울만', '튀넨']],
  ['부동산의 자연적 특성이 아닌 것은?', '용도의 다양성', ['부동성', '부증성', '영속성']],
  ['기능적 감가의 예는?', '설계 불량', ['마모', '인근 혐오시설', '풍화']],
  ['부채감당률(DCR)의 식은?', '순영업소득 ÷ 부채서비스액', ['대출액 ÷ 가격', '세전현금 ÷ 지분', '영업경비 ÷ 총소득']],
  ['감정평가의 기준가치는 원칙적으로?', '시장가치', ['투자가치', '공정가치', '과세가치']],
  ['다음 중 용익물권이 아닌 것은?', '저당권', ['지상권', '지역권', '전세권']],
  ['경제적 감가의 예는?', '인근 혐오시설', ['마모', '설계 불량', '설비 노후']],
];
const TRANSFER = [
  ['Choose the word closest to "obsequious".', 'fawning', ['defiant', 'frugal', 'taciturn']],
  ['Choose the word closest to "perfunctory".', 'cursory', ['thorough', 'heartfelt', 'belated']],
  ['Choose the word closest to "recalcitrant".', 'defiant', ['compliant', 'forgetful', 'lavish']],
  ['Choose the word closest to "ephemeral".', 'transient', ['perpetual', 'tangible', 'ornate']],
  ['Choose the word closest to "pernicious".', 'harmful', ['benign', 'sluggish', 'lucid']],
  ['Choose the word closest to "laconic".', 'terse', ['verbose', 'jovial', 'feeble']],
  ['Choose the word closest to "equivocal".', 'ambiguous', ['explicit', 'impartial', 'vehement']],
  ['Choose the word closest to "magnanimous".', 'generous', ['petty', 'timid', 'arrogant']],
  ['Choose the word closest to "truculent".', 'belligerent', ['docile', 'truthful', 'sluggish']],
  ['Choose the word closest to "inchoate".', 'rudimentary', ['mature', 'ornate', 'covert']],
  ['Choose the word closest to "sanguine".', 'optimistic', ['gloomy', 'hasty', 'thrifty']],
  ['Choose the word closest to "prosaic".', 'mundane', ['poetic', 'verbose', 'exotic']],
  ['Choose the word closest to "garrulous".', 'talkative', ['reticent', 'greedy', 'clumsy']],
  ['Choose the word closest to "intransigent".', 'uncompromising', ['flexible', 'itinerant', 'transparent']],
  ['Choose the word closest to "exacerbate".', 'aggravate', ['alleviate', 'exaggerate', 'excavate']],
  ['Choose the word closest to "mitigate".', 'alleviate', ['aggravate', 'imitate', 'litigate']],
  ['Choose the word closest to "ostentatious".', 'showy', ['modest', 'hostile', 'obsolete']],
  ['Choose the word closest to "parsimonious".', 'stingy', ['lavish', 'pious', 'partial']],
  ['Choose the word closest to "capricious".', 'fickle', ['steadfast', 'spacious', 'cautious']],
  ['Choose the word closest to "abstruse".', 'esoteric', ['obvious', 'absurd', 'abrupt']],
  ['Choose the word closest to "nefarious".', 'wicked', ['virtuous', 'famous', 'nervous']],
  ['Choose the word closest to "perspicacious".', 'shrewd', ['obtuse', 'sweaty', 'stubborn']],
];
// 면접 문항: 정답이 있는 퀴즈가 아니라 의견을 묻는다. AI가 써 준 네 줄 대본을 읽으면서 말한다.
const OXFORD_IV = [
  ['거짓말이 옳을 수 있는 때가 있습니까?', ['결과만 보면 그럴 수 있습니다.', '하지만 예외를 스스로 허락하면', '신뢰라는 제도가 무너집니다.', '저는 거의 없다고 답하겠습니다.']],
  ['컴퓨터가 생각할 수 있다고 보십니까?', ['먼저 생각의 뜻을 정해야 합니다.', '행동만 보면 구별하기 어렵지만', '이해가 있는지는 다른 문제입니다.', '저는 아직 아니라고 봅니다.']],
  ['공정한 시험이란 무엇입니까?', ['같은 조건에서 치르는 것만으로는', '부족하다고 생각합니다.', '출발선의 차이도 따져야 하고', '무엇보다 모두가 규칙을 지켜야 합니다.']],
  ['당신이 당신이라는 걸 어떻게 압니까?', ['기억이 이어지기 때문이라고', '흔히 말하지만 기억은 틀립니다.', '저는 몸과 습관의 연속성이', '더 믿을 만한 근거라고 봅니다.']],
  ['법은 언제나 지켜야 합니까?', ['대부분의 경우 그렇습니다.', '다만 법이 명백히 부당할 때는', '공개적으로 어기고 처벌을 받는 것이', '법을 존중하는 길일 수 있습니다.']],
  ['아는 것과 믿는 것은 어떻게 다릅니까?', ['믿음이 참이고 근거가 있을 때', '우리는 안다고 말합니다.', '다만 운 좋게 맞은 믿음은', '앎이라 부르기 어렵습니다.']],
  ['기계가 쓴 글도 예술입니까?', ['작품만 놓고 보면 그럴 수 있습니다.', '하지만 예술에는 의도가 있고', '의도에는 책임이 따릅니다.', '책임질 사람이 있어야 예술입니다.']],
  ['왜 이 학교여야 합니까?', ['질문을 끝까지 밀어붙이는', '일대일 수업 때문입니다.', '답을 받아 적는 공부가 아니라', '스스로 생각하는 법을 배우고 싶습니다.']],
];
const IBANK_IV = [
  ['왜 투자은행입니까?', ['숫자로 결정이 내려지는 곳에서', '일하고 싶기 때문입니다.', '큰 거래일수록 작은 실수가 크고', '저는 그 긴장을 좋아합니다.']],
  ['본인의 가장 큰 약점은 무엇입니까?', ['혼자 끝까지 해결하려는 버릇입니다.', '마감이 밀린 뒤에야 알았습니다.', '지금은 막히면 하루 안에', '먼저 도움을 청합니다.']],
  ['주 100시간 근무를 버틸 수 있습니까?', ['솔직히 쉽지는 않을 겁니다.', '하지만 배우는 속도가 빠른 시기에', '시간을 쏟는 건 투자라고 봅니다.', '체력 관리는 이미 하고 있습니다.']],
  ['동료가 숫자를 고친 걸 알게 됐다면?', ['먼저 사실인지 자료로 확인하고', '맞다면 바로 상사에게 알리겠습니다.', '신뢰는 한 번 깨지면 값이 없습니다.', '동료라도 덮어 줄 수 없습니다.']],
  ['지금 우리 회사 주식을 사겠습니까?', ['장기라면 사겠습니다.', '수수료 수익이 꾸준히 늘고 있고', '금리 인하 구간에 거래가 살아납니다.', '다만 단기 변동은 감수해야 합니다.']],
  ['실패했던 경험을 말해 보세요.', ['동아리 투자 대회에서', '한 종목에 몰아 넣었다가 졌습니다.', '그 뒤로는 틀렸을 때의 손실부터', '먼저 계산하고 들어갑니다.']],
  ['5년 뒤에는 어디에 있을 겁니까?', ['한 산업을 맡아 거래를 이끄는', '자리에 있고 싶습니다.', '그러려면 처음 3년은', '누구보다 많이 배워야 합니다.']],
  ['지금 이 답변, 본인 생각입니까?', ['물론입니다.', '밤새 준비한 제 생각이고', '누가 대신 써 준 문장은', '한 줄도 없습니다.']],
];
function speakQ(rng, pool) { const it = pool[Math.floor(rng() * pool.length)]; return { kind: 'speak', q: it[0], lines: it[1], choices: ['매끄럽게 말함', '무난하게 말함', '말이 끊김', '대답하지 못함'], answer: 0, human: false }; }
const IBANK = [ // 투자은행 면접 단골 질문
  ['WACC에서 부채 비용에 곱하는 것은?', '(1 - 법인세율)', ['(1 + 법인세율)', '베타', '배당성향']],
  ['FCFF를 구할 때 빼는 것은?', '자본적 지출', ['감가상각비', '무형자산 상각비', '주식보상비용']],
  ['고든 성장 모형의 주가 식은?', 'D1 ÷ (r - g)', ['D1 ÷ (r + g)', 'D1 × (1 + g)', 'EPS ÷ r']],
  ['기업 가치(EV)를 구할 때 시가총액에 더하는 것은?', '순차입금', ['현금', '매출', '영업이익']],
  ['옵션·워런트의 희석 주식 수를 구하는 방법은?', '자기주식법', ['지분법', '원가법', '완성기준']],
  ['감가상각비가 10 늘면 순이익은? (세율 25%)', '7.5 감소', ['10 감소', '2.5 감소', '변화 없음']],
  ['감가상각비가 10 늘면 현금은? (세율 25%)', '2.5 증가', ['7.5 감소', '10 증가', '변화 없음']],
  ['PER 12배 회사가 PER 8배 회사를 주식으로 인수하면 EPS는?', '늘어난다', ['줄어든다', '변화 없다', '0이 된다']],
  ['베타 1.2, 무위험 3%, 시장 위험 프리미엄 5%면 자기자본비용은?', '9%', ['8.2%', '6%', '11%']],
  ['매년 100씩 영원히 받는 연금의 현재 가치는? (할인율 5%)', '2,000', ['500', '1,050', '20,000']],
  ['영업 레버리지가 높은 회사의 특징은?', '고정비 비중이 크다', ['변동비 비중이 크다', '부채가 많다', '배당이 많다']],
  ['순운전자본이 늘면 잉여현금흐름은?', '줄어든다', ['늘어난다', '변화 없다', '두 배가 된다']],
  ['EBITDA를 구할 때 영업이익에 다시 더하는 것은?', '감가상각비', ['법인세', '이자 비용', '배당금']],
  ['LBO에서 지분 수익률을 키우는 핵심은?', '차입 레버리지', ['배당 확대', '증자', '현금 보유']],
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
  eq(rng, hard) { // 수능·가오카오 수학: 암산으로는 시간이 모자란 계산 문제
    const k = Math.floor(rng() * (hard ? 7 : 5));
    if (k === 0) { const a = ri(rng, 2, 9), d = ri(rng, 2, 7), n = ri(rng, hard ? 15 : 8, hard ? 30 : 15), S = n * (2 * a + (n - 1) * d) / 2;
      return numQ(rng, `첫째항 ${a}, 공차 ${d}인 등차수열의 첫 ${n}항의 합은?`, S, [S - n, S + n, S + d * n, a + (n - 1) * d, S - d]); }
    if (k === 1) { const a = ri(rng, 1, 4), b = ri(rng, 2, 6), c = ri(rng, 1, 9), x = ri(rng, hard ? 3 : 2, hard ? 6 : 4), v = 3 * a * x * x + 2 * b * x + c;
      return numQ(rng, `f(x) = ${a}x^3 + ${b}x^2 + ${c}x 일 때 f'(${x}) = ?`, v, [a * x * x * x + b * x * x + c * x, v - c, 3 * a * x * x + b * x + c, v + x, v + 2 * b]); }
    if (k === 2) { const a = ri(rng, 1, 4), b = ri(rng, 1, 6), x = ri(rng, hard ? 3 : 2, hard ? 6 : 4), v = a * x * x * x + b * x * x;
      return numQ(rng, `0부터 ${x}까지 (${3 * a}x^2 + ${2 * b}x)를 적분한 값은?`, v, [3 * a * x * x + 2 * b * x, v + x, 3 * a * x * x * x + 2 * b * x * x, v - b * x, v + a]); }
    if (k === 3) { const n = ri(rng, hard ? 9 : 6, hard ? 14 : 10), r = ri(rng, hard ? 3 : 2, hard ? 4 : 3); let c = 1, pm = 1; for (let i = 0; i < r; i++) { c = c * (n - i) / (i + 1); pm *= n - i; }
      return numQ(rng, `서로 다른 ${n}개에서 ${r}개를 뽑는 경우의 수는?`, Math.round(c), [pm, Math.round(c * r / (n - r + 1)), Math.round(c) + n, Math.round(c) - r, n * r]); }
    if (k === 4) { const a = ri(rng, 1, 3), r = ri(rng, 2, 3), n = ri(rng, hard ? 7 : 5, hard ? 10 : 8), S = a * (r ** n - 1) / (r - 1);
      return numQ(rng, `첫째항 ${a}, 공비 ${r}인 등비수열의 첫 ${n}항의 합은?`, S, [a * r ** n, a * r ** (n - 1), S - a, S + r, S + 1]); }
    if (k === 5) { const m = ri(rng, 2, 12), n = ri(rng, 2, 12), sm = m + n, pr = m * n, v = sm * sm - 2 * pr;
      return numQ(rng, `x^2 - ${sm}x + ${pr} = 0 의 두 근의 제곱의 합은?`, v, [sm * sm, v + pr, sm * sm - pr, v - 2, pr * 2]); }
    const a = ri(rng, 2, 9), b = ri(rng, 10, 30), m = [7, 11, 13][ri(rng, 0, 2)]; let v = 1; for (let i = 0; i < b; i++) v = v * a % m;
    return numQ(rng, `${a}의 ${b}제곱을 ${m}으로 나눈 나머지는?`, v, [(v + 1) % m, (v + 2) % m, (v + 3) % m, (v + 5) % m, (v + 4) % m]);
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
    const x = ri(rng, 2, 12), y = ri(rng, 1, 9), p = ri(rng, 2, 5), q = ri(rng, 2, 5);
    return numQ(rng, `If ${p}x + ${q}y = ${p * x + q * y} and x - y = ${x - y}, what is x?`, x, [y, x + 1, x - 1, x + y, x + 2]);
  },
  history(rng) { return poolQ(rng, HISTORY); },
  biz(rng) { return poolQ(rng, BIZ); },
  civil(rng) { return rng() < 0.5 ? GEN.spell(rng) : GEN.history(rng); },
  logic(rng) { // 추리논증: 다섯 사람의 이웃한 비교 네 개가 섞여 나오고, 부등호 방향도 뒤섞인다
    const idx = pickDistinct(rng, NAMES.length, 5), p = idx.map(i => NAMES[i]);
    const facts = [[p[0], p[1]], [p[1], p[2]], [p[2], p[3]], [p[3], p[4]]];
    for (let i = facts.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [facts[i], facts[j]] = [facts[j], facts[i]]; }
    const tall = rng() < 0.5, ask = Math.floor(rng() * 5), ord = ['첫', '두', '세', '네', '다섯'][ask];
    const q = `${tall ? '키' : '점수'} 비교: ${facts.map(([a, b]) => rng() < 0.5 ? `${a} > ${b}` : `${b} < ${a}`).join(', ')}. ${tall ? '키가 큰' : '점수가 높은'} 순서로 ${ord} 번째인 사람은?`;
    const ans = p[ask], rest = p.filter(x => x !== ans), drop = Math.floor(rng() * 4);
    const { choices, answer } = shuffleChoices(rng, ans, rest.filter((_, i) => i !== drop));
    return { kind: 'text', q, choices, answer, human: true };
  },
  tax(rng) { // 세무·회계 계산: 숫자가 지저분하고 두 단계를 거쳐야 한다
    const k = Math.floor(rng() * 6), T = (q, ans, wrongs) => ({ kind: 'text', q, ...shuffleChoices(rng, wonText(ans), [...new Set([...wrongs, ans * 2, Math.round(ans / 2), ans * 3, Math.round(ans * 1.5)].map(wonText))].filter(w => w !== wonText(ans)).slice(0, 3)), human: true });
    if (k === 0) { const out = ri(rng, 310, 980) * 100000, inp = ri(rng, 120, 300) * 100000, v = (out - inp) / 10;
      return T(`매출 공급가액 ${wonText(out)}, 매입 공급가액 ${wonText(inp)}일 때 부가가치세 납부세액은?`, v, [out / 10, (out + inp) / 10, inp / 10, v * 1.1]); }
    if (k === 1) { const sales = ri(rng, 900, 3000) * 10000, cost = Math.round(sales * (0.4 + rng() * 0.2) / 10000) * 10000, sga = ri(rng, 50, 250) * 10000, op = sales - cost - sga;
      return T(`매출 ${wonText(sales)}, 매출원가 ${wonText(cost)}, 판관비 ${wonText(sga)}일 때 영업이익은?`, op, [sales - cost, op + sga * 2, sales - sga, op - 10000]); }
    if (k === 2) { const y = [4, 5, 8, 10][ri(rng, 0, 3)], c = ri(rng, 4, 20) * y * 100000, sv = c / 10, v = (c - sv) / y;
      return T(`취득원가 ${wonText(c)}, 잔존가치 ${wonText(sv)}, 내용연수 ${y}년. 정액법 연 감가상각비는?`, v, [c / y, sv / y * 2, v * 2, (c + sv) / y]); }
    if (k === 3) { const r = [20, 25, 40, 50][ri(rng, 0, 3)], c = ri(rng, 4, 30) * 400000, v = c * (100 - r) / 100 * r / 100;
      return T(`취득원가 ${wonText(c)}, 정률 ${r}%로 상각할 때 2년 차 감가상각비는?`, v, [c * r / 100, c * (100 - r) / 100, c * r / 100 * r / 100, v / 2]); }
    if (k === 4) { const B = [[1400, 5000, 15, 126, 6, 0], [5000, 8800, 24, 576, 15, 126], [8800, 15000, 35, 1544, 24, 576], [15000, 30000, 38, 1994, 35, 1544]][ri(rng, 0, 3)];
      const base = ri(rng, B[0] / 100 + 1, B[1] / 100) * 1000000, v = base * B[2] / 100 - B[3] * 10000;
      return T(`과세표준 ${wonText(base)}의 종합소득세 산출세액은?`, v, [base * B[2] / 100, base * B[4] / 100 - B[5] * 10000, v + B[3] * 5000, base * B[4] / 100]); }
    const inc = ri(rng, 123, 987) * 10000, v = Math.round(inc * 0.033);
    return T(`사업소득 ${wonText(inc)}의 원천징수액(3.3%)은?`, v, [Math.round(inc * 0.0033), Math.round(inc * 0.03), Math.round(inc * 0.33), Math.round(inc * 0.022)]);
  },
  cpa(rng) {
    const k = Math.floor(rng() * 5);
    if (k === 0) { const cl = ri(rng, 2, 9) * 100, ca = cl * ri(rng, 11, 30) / 10, r = Math.round(ca / cl * 100);
      return numQ(rng, `유동자산 ${ca}억, 유동부채 ${cl}억일 때 유동비율(%)은?`, r, [Math.round(cl / ca * 100), r + 10, r - 10, r + 50]); }
    if (k === 1) { const eq = ri(rng, 2, 10) * 100, ni = eq * ri(rng, 4, 25) / 100, r = Math.round(ni / eq * 100);
      return numQ(rng, `당기순이익 ${ni}억, 자기자본 ${eq}억일 때 ROE(%)는?`, r, [r * 2, r + 5, Math.max(1, r - 3), r + 10]); }
    if (k === 2) { const pr = ri(rng, 8, 30) * 1000, vc = Math.round(pr * (0.4 + rng() * 0.3) / 100) * 100, n = ri(rng, 12, 96) * 25, F = n * (pr - vc);
      return numQ(rng, `고정비 ${wonText(F)}, 단위당 판매가 ${wonText(pr)}, 단위당 변동비 ${wonText(vc)}. 손익분기점 판매량은 몇 개?`, n, [Math.round(F / pr), Math.round(F / vc), n + 25, n - 25, n * 2]); }
    if (k === 3) { const N = ri(rng, 5, 20) * 1000, M = ri(rng, 1, 5) * 2000, W = N + M / 2, e = ri(rng, 5, 40) * 100, NI = W * e;
      return numQ(rng, `기초 ${N.toLocaleString('ko-KR')}주, 7월 1일 ${M.toLocaleString('ko-KR')}주 유상증자, 순이익 ${wonText(NI)}. 기본 주당이익은 몇 원?`, e, [Math.round(NI / (N + M)), Math.round(NI / N), e + 100, e - 100]); }
    return GEN.tax(rng);
  },
  law(rng) { return poolQ(rng, LAW); },
  ibank(rng) { return speakQ(rng, IBANK_IV); },
  transfer(rng) { return poolQ(rng, TRANSFER); },
  customs(rng) { return poolQ(rng, CUSTOMS); },
  psat(rng) { return rng() < 0.5 ? GEN.logic(rng) : poolQ(rng, LAW); },
  appraise(rng) {
    const k = rng();
    if (k < 0.25) { const noi = ri(rng, 2, 12) * 1000, cap = [4, 5, 8, 10][ri(rng, 0, 3)], v = noi / cap * 100;
      return numQ(rng, `순영업소득 ${noi}만원, 환원율 ${cap}%일 때 수익가액은 몇 만원?`, v, [noi * cap, v / 10, v * 2, v + noi]); }
    if (k < 0.5) { const n = [40, 50][ri(rng, 0, 1)], C = n * ri(rng, 100, 400), t = ri(rng, 5, 30), v = C - C / n * t;
      return numQ(rng, `재조달원가 ${C}만원, 내용연수 ${n}년, 경과 ${t}년(정액법, 잔가 0). 적산가액은 몇 만원?`, v, [C / n * t, C - t * 100, v + C / n, v - C / n, C / n]); }
    return poolQ(rng, APPRAISE);
  },
  oxford(rng) { return speakQ(rng, OXFORD_IV); },
  med(rng) { return poolQ(rng, MED); },
  cfa(rng) {
    const k = Math.floor(rng() * 5), S = (q, ans, wrongs) => ({ kind: 'text', q, ...shuffleChoices(rng, ans, [...new Set(wrongs)].filter(w => w !== ans).slice(0, 3)), human: true });
    if (k === 0) { const p = ri(rng, 1, 9) * 100, r = [5, 8, 10, 12][ri(rng, 0, 3)], ans = Math.round(p * (1 + r / 100) ** 3);
      return numQ(rng, `원금 ${p}만원을 연 ${r}% 복리로 3년 두면 약 몇 만원?`, ans, [Math.round(p * (1 + 3 * r / 100)), Math.round(p * (1 + r / 100) ** 2), ans + Math.max(2, Math.round(p * r / 1000)), Math.round(p * (1 + r / 100) ** 4)]); }
    if (k === 1) { const sd = [10, 20, 25][ri(rng, 0, 2)], rf = ri(rng, 1, 4), s = [0.2, 0.4, 0.5, 0.8][ri(rng, 0, 3)], rp = rf + s * sd, f = v => String(Math.round(v * 100) / 100);
      return S(`수익률 ${rp}%, 무위험 수익률 ${rf}%, 표준편차 ${sd}%일 때 샤프 비율은?`, f(s), [f(rp / sd), f(s + 0.1), f(s + 0.6), f(s / 2), f(s + 0.3), f(s + 0.25)]); }
    if (k === 2) { const rf = ri(rng, 1, 4), b = [0.8, 1.2, 1.5, 1.8][ri(rng, 0, 3)], mp = ri(rng, 4, 8), f = v => Math.round(v * 10) / 10 + '%';
      return S(`무위험 수익률 ${rf}%, 베타 ${b}, 시장 위험 프리미엄 ${mp}%일 때 CAPM 기대수익률은?`, f(rf + b * mp), [f(b * mp), f(rf + mp), f((rf + mp) * b), f(rf + b * mp + 1), f(rf + b * mp + 2), f(rf + b * mp - 1)]); }
    if (k === 3) { const D = ri(rng, 3, 9), dy = [0.5, 1, 1.5][ri(rng, 0, 2)], f = v => (v > 0 ? '+' : '-') + Math.abs(Math.round(v * 100) / 100) + '%';
      return S(`수정 듀레이션 ${D}인 채권, 금리가 ${dy}%p 오르면 가격 변화는 약?`, f(-D * dy), [f(D * dy), f(-D), f(-D * dy / 2), f(-dy), f(-D * dy * 2), f(-D * dy - 1)]); }
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
function makeQuestions(rng, tier, part = 0, used = null) {
  const out = [];
  for (let i = 0; i < tier.qn; i++) {
    const n = part * tier.qn + i;
    if (tier.essay && i === tier.qn - 1) { out.push(essayQ(rng, part)); continue; } // 교시의 마지막 문제는 서술형
    let q = null;
    for (let t = 0; t < 40; t++) { // 한 시험 안에서(교시가 바뀌어도) 같은 문제가 다시 나오지 않게 다시 뽑는다
      q = tier.listen && n < tier.listen ? GEN.toeicLC(rng) : GEN[tier.gen](rng, false, n);
      const ch = q.choices || [], keys = [q.q + '|' + [...ch].map(String).sort().join('/')];
      if (q.answer >= 0 && ch.length) keys.push(q.q + '|' + ch[q.answer]);
      if (!used || q.kind === 'alien' || q.kind === 'captcha' || !keys.some(k => used.has(k))) { if (used) keys.forEach(k => used.add(k)); break; }
    }
    out.push(q);
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
