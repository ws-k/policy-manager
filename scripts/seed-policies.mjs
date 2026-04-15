/**
 * Seed script: creates sample policies for testing
 * Usage: node scripts/seed-policies.mjs
 */

const SUPABASE_URL = 'https://vpmblzdxtducrbkdchur.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbWJsemR4dGR1Y3Jia2RjaHVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTYyMTA3MCwiZXhwIjoyMDkxMTk3MDcwfQ.l9krnGZLRHju2obROTdXP81Y358upnWZIqo-ts4gV5s'

const DOMAINS = {
  legal:      '8e0cfaa4-1f9b-4fb1-b480-6b5483927bf1',
  membership: 'cbcf5eb3-b4b4-40f2-87b4-282c56b6a4d8',
  data:       '967c0a2d-626c-42e5-be4e-5527b97a866c',
  operations: 'c42f8f6b-1e06-4472-b6f2-240857be787a',
  store:      '64bd3370-5b98-46c9-8f1b-91c5975a6fb8',
  ux:         '585fa003-336b-464a-b5b5-484d37d21ead',
}

const headers = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

function doc(...nodes) {
  return { type: 'doc', content: nodes }
}

function h1(text) {
  return { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text }] }
}

function h2(text) {
  return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] }
}

function h3(text) {
  return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] }
}

function p(...items) {
  const content = items.map(item =>
    typeof item === 'string' ? { type: 'text', text: item } : item
  )
  return { type: 'paragraph', content }
}

function bold(text) {
  return { type: 'text', marks: [{ type: 'bold' }], text }
}

function ul(...items) {
  return {
    type: 'bulletList',
    content: items.map(item => ({
      type: 'listItem',
      content: [p(item)],
    })),
  }
}

function ol(...items) {
  return {
    type: 'orderedList',
    content: items.map(item => ({
      type: 'listItem',
      content: [p(item)],
    })),
  }
}

function table(rows) {
  return {
    type: 'table',
    content: rows.map((row, rowIdx) => ({
      type: 'tableRow',
      content: row.map(cell => ({
        type: rowIdx === 0 ? 'tableHeader' : 'tableCell',
        attrs: { colspan: 1, rowspan: 1, colwidth: null },
        content: [p(cell)],
      })),
    })),
  }
}

function hr() {
  return { type: 'horizontalRule' }
}

// ─── Policy content definitions ───────────────────────────────────────────────

const POLICIES = [
  // 1. 서비스 이용약관
  {
    domain_id: DOMAINS.legal,
    title: '서비스 이용약관',
    slug: 'terms-of-service',
    status: 'published',
    is_public: true,
    content: doc(
      h1('서비스 이용약관'),
      p('본 약관은 동승그룹(이하 "회사")이 제공하는 DS Visitor 서비스(이하 "서비스") 이용에 관한 조건 및 절차, 회사와 이용자의 권리·의무 및 책임 사항을 규정합니다.'),
      p(bold('시행일: '), '2026년 1월 1일'),
      hr(),
      h2('제1조 (목적)'),
      p('이 약관은 회사가 제공하는 동대문종합상가 방문객 안내 서비스(이하 "서비스")의 이용조건 및 절차에 관한 사항과 기타 필요한 사항을 규정함을 목적으로 합니다.'),
      h2('제2조 (정의)'),
      p('이 약관에서 사용하는 용어의 정의는 다음과 같습니다.'),
      table([
        ['용어', '정의'],
        ['"서비스"', '회사가 제공하는 DS Visitor 앱 및 웹 서비스 일체'],
        ['"이용자"', '서비스에 접속하여 이 약관에 따라 서비스를 이용하는 자'],
        ['"회원"', '서비스에 회원 등록을 한 이용자'],
        ['"콘텐츠"', '서비스 내에 게시된 매장 정보, 이미지, 지도 등 일체의 데이터'],
      ]),
      h2('제3조 (약관의 효력 및 변경)'),
      ol(
        '이 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다.',
        '회사는 합리적인 사유가 있는 경우 약관을 변경할 수 있으며, 변경 시 적용일자 및 변경 사유를 명시하여 7일 전에 공지합니다.',
        '회원이 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.',
      ),
      h2('제4조 (서비스의 제공 및 변경)'),
      p('회사는 다음의 서비스를 제공합니다.'),
      ul(
        '동대문종합상가 매장 정보 검색 및 탐색',
        '실내 지도 기반 매장 위치 안내',
        '매장 길찾기 서비스',
        '기타 회사가 정하는 서비스',
      ),
      h2('제5조 (서비스의 중단)'),
      p('회사는 다음 각 호에 해당하는 경우 서비스 제공을 중단할 수 있습니다.'),
      ul(
        '서비스용 설비의 보수 등 공사로 인한 부득이한 경우',
        '전기통신사업법에 규정된 기간통신사업자가 전기통신 서비스를 중지한 경우',
        '국가비상사태, 서비스 설비의 장애 또는 서비스 이용의 폭주 등으로 서비스 이용에 지장이 있는 경우',
      ),
      h2('제6조 (회원가입)'),
      p('서비스 이용을 위한 회원가입은 다음 절차에 따릅니다.'),
      ol(
        '이용자가 약관에 동의하고 가입 신청',
        '회사가 신청을 승낙하면 회원가입 완료',
        '만 14세 미만 이용자는 회원가입 불가',
      ),
      h2('제7조 (개인정보보호)'),
      p('회사는 이용자의 개인정보를 보호하기 위해 개인정보처리방침을 수립하고 준수합니다. 자세한 내용은 개인정보처리방침을 참고하시기 바랍니다.'),
      h2('제8조 (분쟁 해결)'),
      p('서비스와 관련하여 분쟁이 발생한 경우 회사와 이용자는 분쟁을 원만히 해결하기 위해 성실히 협의합니다. 협의가 이루어지지 않을 경우 서울중앙지방법원을 제1심 관할 법원으로 합니다.'),
    ),
    sections: ['목적 및 정의', '서비스 제공', '회원 관리', '분쟁 해결'],
  },

  // 2. 개인정보처리방침
  {
    domain_id: DOMAINS.legal,
    title: '개인정보처리방침',
    slug: 'privacy-policy',
    status: 'published',
    is_public: true,
    content: doc(
      h1('개인정보처리방침'),
      p('동승그룹(이하 "회사")은 개인정보보호법에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.'),
      hr(),
      h2('1. 수집하는 개인정보 항목'),
      table([
        ['구분', '수집 항목', '수집 목적', '보유 기간'],
        ['필수', '이메일, 비밀번호', '회원 식별 및 로그인', '탈퇴 후 30일'],
        ['선택', '이름, 연락처', '고객 지원', '수집 후 1년'],
        ['자동', 'IP, 접속 기록', '서비스 보안 및 통계', '6개월'],
      ]),
      h2('2. 개인정보의 수집 및 이용 목적'),
      ul(
        '회원 가입 및 관리: 회원제 서비스 이용에 따른 본인 식별·인증',
        '서비스 제공: 매장 정보 탐색, 길찾기 등 핵심 서비스 제공',
        '고충 처리: 민원인의 신원 확인, 민원 처리',
        '서비스 개선: 이용 통계 분석을 통한 서비스 품질 향상',
      ),
      h2('3. 개인정보의 보유 및 이용 기간'),
      p('회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 아래와 같이 보관합니다.'),
      ul(
        '계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)',
        '소비자 불만 또는 분쟁 처리에 관한 기록: 3년',
        '접속에 관한 기록: 1년 (통신비밀보호법)',
      ),
      h2('4. 개인정보의 파기 절차 및 방법'),
      p('회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.'),
      ol(
        '전자적 파일 형태로 기록·저장된 개인정보: 기록을 재생할 수 없도록 기술적 방법으로 삭제',
        '종이 문서에 기록·저장된 개인정보: 분쇄기로 분쇄하거나 소각',
      ),
      h2('5. 이용자의 권리·의무 및 행사 방법'),
      p('이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.'),
      ul(
        '개인정보 처리 현황 열람 요구',
        '오류 등이 있을 경우 정정 요구',
        '삭제 요구',
        '처리 정지 요구',
      ),
      h2('6. 개인정보 보호책임자'),
      table([
        ['구분', '내용'],
        ['이름', '동승그룹 개인정보 보호팀'],
        ['이메일', 'privacy@dongseung.co.kr'],
        ['연락처', '02-0000-0000'],
      ]),
    ),
    sections: ['수집 항목', '이용 목적', '보유 기간', '이용자 권리', '보호책임자'],
  },

  // 3. 회원가입 및 탈퇴 정책
  {
    domain_id: DOMAINS.membership,
    title: '회원가입 및 탈퇴 정책',
    slug: 'signup-withdrawal',
    status: 'published',
    is_public: false,
    content: doc(
      h1('회원가입 및 탈퇴 정책'),
      p('본 정책은 DS Visitor 서비스의 회원가입 절차, 자격 요건, 그리고 탈퇴 프로세스를 정의합니다.'),
      hr(),
      h2('1. 회원가입'),
      h3('1.1 가입 자격'),
      ul(
        '만 14세 이상인 자',
        '본 약관 및 개인정보처리방침에 동의한 자',
        '실명으로 가입하는 자 (본인 인증 미완료 계정은 일부 기능 제한)',
      ),
      h3('1.2 가입 필수 정보'),
      table([
        ['항목', '형식', '비고'],
        ['이메일', 'example@domain.com', '로그인 ID로 사용'],
        ['비밀번호', '영문+숫자+특수문자 8자 이상', '대소문자 구분'],
        ['약관 동의', '필수 동의', '이용약관, 개인정보처리방침'],
      ]),
      h3('1.3 가입 불가 사유'),
      ul(
        '이미 가입된 이메일로 재가입 시도',
        '타인 정보를 도용하여 가입 시도',
        '이전에 서비스 이용이 제한된 이력이 있는 경우',
        '기타 회사 정책에 위반되는 경우',
      ),
      h2('2. 계정 관리'),
      h3('2.1 비밀번호 정책'),
      ul(
        '영문 대소문자, 숫자, 특수문자 조합 8자 이상',
        '동일 문자 4개 이상 연속 사용 불가',
        '90일마다 비밀번호 변경 권장 (강제 변경 없음)',
        '최근 3개 비밀번호 재사용 불가',
      ),
      h3('2.2 휴면 계정 처리'),
      p('12개월 이상 로그인 기록이 없는 계정은 휴면 계정으로 전환됩니다.'),
      ol(
        '전환 30일 전 이메일 사전 고지',
        '휴면 전환 후 재로그인 시 본인 인증 절차 진행',
        '휴면 계정의 개인정보는 분리 저장하여 보호',
      ),
      h2('3. 탈퇴'),
      h3('3.1 탈퇴 절차'),
      ol(
        '앱 내 마이페이지 > 계정 설정 > 탈퇴 신청',
        '탈퇴 사유 선택 (선택)',
        '비밀번호 재입력으로 본인 확인',
        '탈퇴 완료 및 데이터 삭제 안내 확인',
      ),
      h3('3.2 탈퇴 후 데이터 처리'),
      ul(
        '개인식별 정보는 탈퇴 즉시 삭제',
        '법령에 따른 보존 의무 데이터는 해당 기간 후 삭제',
        '탈퇴 후 동일 이메일로 재가입 가능 (30일 이후)',
      ),
    ),
    sections: ['가입 자격', '필수 정보', '계정 관리', '탈퇴 절차'],
  },

  // 4. 데이터 보관 정책
  {
    domain_id: DOMAINS.data,
    title: '데이터 보관 및 삭제 정책',
    slug: 'data-retention',
    status: 'draft',
    is_public: false,
    content: doc(
      h1('데이터 보관 및 삭제 정책'),
      p('본 정책은 DS Visitor 서비스가 수집·처리하는 데이터의 보관 기간과 삭제 기준을 정의합니다. 개인정보보호법 및 관련 법령을 준수하며 최소한의 데이터만 보관합니다.'),
      hr(),
      h2('1. 데이터 분류'),
      table([
        ['분류', '데이터 유형', '보관 기간', '삭제 방법'],
        ['사용자 데이터', '이메일, 비밀번호 해시', '탈퇴 후 30일', '즉시 삭제'],
        ['이용 기록', '로그인 기록, 검색 기록', '1년', '자동 삭제'],
        ['서비스 로그', '에러 로그, 접속 로그', '6개월', '자동 삭제'],
        ['매장 정보', '매장명, 위치, 연락처', '계약 종료 후 1년', '관리자 승인 후 삭제'],
        ['통계 데이터', '집계된 익명 통계', '영구 보관', '해당 없음'],
      ]),
      h2('2. 보관 원칙'),
      h3('2.1 최소 수집 원칙'),
      p('서비스 제공에 필요한 최소한의 데이터만 수집합니다. 서비스 목적과 무관한 데이터는 수집하지 않습니다.'),
      h3('2.2 목적 제한 원칙'),
      p('수집된 데이터는 수집 목적 외의 용도로 사용하지 않습니다. 용도 변경이 필요한 경우 이용자의 별도 동의를 받습니다.'),
      h3('2.3 정확성 원칙'),
      p('이용자가 자신의 데이터를 확인·수정할 수 있는 기능을 제공합니다.'),
      h2('3. 자동 삭제 스케줄'),
      ul(
        '매일 00:00: 만료된 세션 토큰 삭제',
        '매주 일요일: 6개월 이상 된 서비스 로그 삭제',
        '매월 1일: 1년 이상 된 이용 기록 삭제',
        '매분기: 보관 기간 초과 데이터 검토 및 삭제',
      ),
      h2('4. 삭제 요청 처리'),
      p('이용자는 언제든지 자신의 데이터 삭제를 요청할 수 있습니다.'),
      ol(
        '요청 접수 후 5영업일 이내 처리',
        '법적 의무 보관 데이터는 삭제 불가 (사유 안내)',
        '처리 결과 이메일 통보',
      ),
    ),
    sections: ['데이터 분류', '보관 원칙', '자동 삭제', '삭제 요청'],
  },

  // 5. 매장 정보 등록 정책
  {
    domain_id: DOMAINS.store,
    title: '매장 정보 등록 및 관리 정책',
    slug: 'store-info-policy',
    status: 'published',
    is_public: false,
    content: doc(
      h1('매장 정보 등록 및 관리 정책'),
      p('본 정책은 DS Visitor 서비스에 매장 정보를 등록·수정·삭제하는 기준과 절차를 정의합니다.'),
      hr(),
      h2('1. 등록 가능 매장 범위'),
      p('아래 조건을 모두 충족하는 매장에 한해 등록이 가능합니다.'),
      ul(
        '동대문종합상가(A동, B동, C동, 신관) 내 위치한 매장',
        '동승그룹과 정식 임대차 계약을 체결한 매장',
        '현재 영업 중인 매장 (임시 휴업 포함)',
      ),
      h2('2. 필수 등록 정보'),
      table([
        ['항목', '필수/선택', '설명'],
        ['매장명', '필수', '실제 영업 중인 상호명'],
        ['위치 (동·층·호)', '필수', '예: A동 3층 305호'],
        ['취급 품목', '필수', '원단/부자재 카테고리 선택'],
        ['영업시간', '필수', '평일/토요일/공휴일 각각 기재'],
        ['대표 연락처', '선택', '전화번호 또는 이메일'],
        ['매장 사진', '선택', '최대 5장, 각 5MB 이하'],
        ['매장 설명', '선택', '취급 품목, 특징 등 자유 기재'],
      ]),
      h2('3. 금지 사항'),
      h3('3.1 허위 정보 등록 금지'),
      ul(
        '실제와 다른 위치 정보 등록',
        '취급하지 않는 품목 카테고리 선택',
        '타 매장의 사진 도용',
        '과장·허위 매장 설명',
      ),
      h3('3.2 부적절한 콘텐츠 금지'),
      ul(
        '저작권 침해 이미지',
        '다른 매장을 비방하는 내용',
        '개인정보가 포함된 이미지',
        '성인 콘텐츠 또는 불법 정보',
      ),
      h2('4. 정보 갱신 의무'),
      p('매장 정보는 변경 사항 발생 시 7일 이내에 갱신해야 합니다.'),
      ul(
        '영업시간 변경',
        '취급 품목 변경',
        '연락처 변경',
        '임시 휴업 또는 폐업',
      ),
      h2('5. 위반 시 조치'),
      table([
        ['위반 수준', '조치 내용'],
        ['경미한 위반', '정보 수정 요청 (7일 이내 미조치 시 자동 비노출)'],
        ['중대한 위반', '즉시 비노출 및 시정 요청'],
        ['반복 위반', '등록 자격 정지'],
      ]),
    ),
    sections: ['등록 범위', '필수 정보', '금지 사항', '정보 갱신', '위반 조치'],
  },

  // 6. 콘텐츠 운영 정책
  {
    domain_id: DOMAINS.operations,
    title: '서비스 운영 정책',
    slug: 'service-operations',
    status: 'draft',
    is_public: false,
    content: doc(
      h1('서비스 운영 정책'),
      p('본 정책은 DS Visitor 서비스의 일상적인 운영 기준, 점검 일정, 긴급 대응 절차를 정의합니다.'),
      hr(),
      h2('1. 서비스 운영 시간'),
      table([
        ['구분', '운영 시간', '비고'],
        ['서비스 이용', '24시간 365일', '정기 점검 시간 제외'],
        ['고객 지원', '평일 09:00 – 18:00', '공휴일 휴무'],
        ['긴급 대응', '24시간', '운영팀 당직 시스템'],
      ]),
      h2('2. 정기 점검'),
      h3('2.1 점검 일정'),
      p('정기 점검은 매주 화요일 새벽 02:00 – 04:00에 실시합니다. 점검 시간 동안 서비스 이용이 일시 중단될 수 있습니다.'),
      h3('2.2 사전 공지'),
      ul(
        '정기 점검: 최소 24시간 전 앱 공지',
        '긴급 점검: 가능한 범위 내 사전 공지',
        '장기 점검 (2시간 초과): 3일 전 이메일 공지',
      ),
      h2('3. 장애 대응'),
      h3('3.1 장애 등급'),
      table([
        ['등급', '기준', '목표 복구 시간'],
        ['P1 (Critical)', '서비스 전체 중단', '30분 이내'],
        ['P2 (High)', '핵심 기능 장애', '2시간 이내'],
        ['P3 (Medium)', '일부 기능 장애', '8시간 이내'],
        ['P4 (Low)', '경미한 오류', '다음 배포 시'],
      ]),
      h3('3.2 장애 대응 절차'),
      ol(
        '장애 감지 및 등급 분류',
        '담당자 즉시 알림 (PagerDuty)',
        '서비스 상태 페이지 업데이트',
        '원인 파악 및 임시 조치',
        '근본 원인 제거 및 서비스 복구',
        '장애 보고서 작성 및 재발 방지책 수립',
      ),
      h2('4. 배포 정책'),
      ul(
        '배포는 평일 오전 10시 이후 진행 (주말·공휴일 배포 금지)',
        '핫픽스를 제외한 모든 배포는 QA 환경 테스트 필수',
        '배포 후 30분간 모니터링 유지',
        '롤백 기준: 에러율 1% 초과 또는 응답시간 3초 초과',
      ),
    ),
    sections: ['운영 시간', '정기 점검', '장애 대응', '배포 정책'],
  },

  // 7. 접근성 정책 (화면·UX)
  {
    domain_id: DOMAINS.ux,
    title: '접근성 및 UI 가이드라인',
    slug: 'accessibility-ui-guidelines',
    status: 'draft',
    is_public: false,
    content: doc(
      h1('접근성 및 UI 가이드라인'),
      p('DS Visitor는 모든 사용자가 동등하게 서비스를 이용할 수 있도록 웹 콘텐츠 접근성 지침(WCAG 2.1 AA)을 준수합니다.'),
      hr(),
      h2('1. 디자인 원칙'),
      h3('1.1 색상 대비'),
      ul(
        '텍스트와 배경의 대비율은 최소 4.5:1 이상 유지',
        '대형 텍스트(18pt 이상)는 최소 3:1 이상',
        '색상만으로 정보를 전달하지 않음 (아이콘, 텍스트 병행)',
      ),
      h3('1.2 터치 타겟'),
      ul(
        '모든 인터랙티브 요소의 터치 영역 최소 44×44px',
        '인접한 터치 타겟 간 최소 8px 간격',
        '스와이프 제스처에는 대안 조작 방법 제공',
      ),
      h2('2. 화면별 UX 기준'),
      table([
        ['화면', '로딩 시간 목표', '오프라인 지원', '스크린리더'],
        ['홈', '1.5초 이내', '캐시된 데이터 표시', '지원'],
        ['검색', '즉시 반응', '최근 검색어', '지원'],
        ['지도', '2초 이내', '마지막 상태 표시', '부분 지원'],
        ['매장 상세', '1초 이내', '기본 정보 캐시', '지원'],
      ]),
      h2('3. 텍스트 및 언어'),
      ul(
        '주 언어: 한국어',
        '국제화(i18n) 구조 사전 준비 (영어, 중국어 추후 지원)',
        '전문 용어 사용 최소화, 필요 시 용어 설명 제공',
        '버튼 텍스트는 동사형으로 (예: "검색하기", "보러가기")',
      ),
      h2('4. 오류 메시지 가이드라인'),
      ol(
        '오류 원인을 명확하게 설명 (예: "이메일 형식이 올바르지 않습니다")',
        '해결 방법 제시 (예: "example@email.com 형식으로 입력해주세요")',
        '기술적 오류 코드는 사용자에게 노출하지 않음',
        '오류 발생 시 사용자 입력값은 유지',
      ),
    ),
    sections: ['디자인 원칙', 'UX 기준', '텍스트 가이드', '오류 메시지'],
  },
]

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function sbPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
}

async function sbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  })
  return res.ok
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding policies...\n')

  for (const policy of POLICIES) {
    const { sections, ...policyData } = policy

    // content_text: strip to plain text
    const contentText = policyData.content.content
      .map(node => {
        if (node.content) {
          return node.content.flatMap(c => c.content?.map(t => t.text ?? '') ?? []).join(' ')
        }
        return ''
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    const payload = {
      ...policyData,
      version: 1,
      content_text: contentText,
      published_at: policyData.status === 'published' ? new Date().toISOString() : null,
    }

    const [created] = await sbPost('policy_docs?select=id,title,status', payload)
    if (!created?.id) {
      console.error('❌', policyData.title, created)
      continue
    }

    console.log(`✅ Created: ${created.title} (${created.status}) → ${created.id}`)

    // Create changelog
    await sbPost('policy_changelogs', {
      policy_doc_id: created.id,
      version: 1,
      change_type: 'create',
      summary: '최초 작성',
      detail: null,
    })

    if (policyData.status === 'published') {
      await sbPost('policy_changelogs', {
        policy_doc_id: created.id,
        version: 1,
        change_type: 'publish',
        summary: '최초 게시',
        detail: null,
      })
    }

    // Create sections
    for (let i = 0; i < sections.length; i++) {
      await sbPost('policy_sections', {
        policy_doc_id: created.id,
        title: sections[i],
        sort_order: i,
        anchor_id: sections[i].toLowerCase().replace(/\s+/g, '-'),
      })
    }

    console.log(`   └ ${sections.length}개 섹션 생성`)
  }

  console.log('\n🎉 Seed complete!')
}

main().catch(console.error)
