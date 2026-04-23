/**
 * DWFM 동대문종합시장 정책 시드 스크립트
 * 실행: npx tsx supabase/seed_dwfm.ts
 * 필요: .env.local에 SUPABASE_SERVICE_ROLE_KEY 설정
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.local')
const envVars: Record<string, string> = {}
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v.length) envVars[k.trim()] = v.join('=').trim()
})

const SUPABASE_URL = envVars['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_KEY  = envVars['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ .env.local에 SUPABASE_SERVICE_ROLE_KEY가 없습니다.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── TipTap content builders ──────────────────────────────────────────────────

function h2(text: string) {
  return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] }
}

function h3(text: string) {
  return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] }
}

function bullets(items: string[]) {
  return {
    type: 'bulletList',
    content: items.map(text => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    })),
  }
}

function table(headers: string[], rows: string[][]) {
  return {
    type: 'table',
    content: [
      {
        type: 'tableRow',
        content: headers.map(h => ({
          type: 'tableHeader',
          attrs: { colspan: 1, rowspan: 1, colwidth: null },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: h }] }]
        }))
      },
      ...rows.map(row => ({
        type: 'tableRow',
        content: row.map(cell => ({
          type: 'tableCell',
          attrs: { colspan: 1, rowspan: 1, colwidth: null },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: cell }] }]
        }))
      }))
    ]
  }
}

function doc(...nodes: object[]) {
  return { type: 'doc', content: nodes }
}

function extractText(node: any): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.content) return node.content.map(extractText).join(' ')
  return ''
}

// ── Policy definitions ───────────────────────────────────────────────────────

const POLICIES: { title: string; slug: string; features: string[]; domain: string; content: object }[] = [

  // ── 홈 화면 ────────────────────────────────────────────────────────────────

  {
    title: '홈 화면 정책',
    slug: 'home-screen',
    domain: 'screen-ux',
    features: ['home'],
    content: doc(

      h2('유저는 히어로 영역에서 앱 정체성을 인식하고 검색·지도·마이페이지에 빠르게 접근할 수 있다'),
      h3('UI'),
      bullets([
        '히어로 배경색: #0A0A0A',
        'paddingHorizontal 24, paddingTop 20, paddingBottom 22',
        '배경 데코 텍스트: "동대문\\n종합시장", fontSize 100, Pretendard-Black, color rgba(255,255,255,0.04), position absolute top 4 right -8 — 터치 이벤트 없음',
        '메인 타이틀 1행 "동대문" / 2행 "종합시장": fontSize 48, Pretendard-Black, color #FFFFFF, letterSpacing -0.9, lineHeight 48',
        '부제목 "오늘은 무얼 만드시나요?": fontSize 16, Pretendard-Light, color rgba(255,255,255,0.85), marginTop 14',
        '마이페이지 버튼: position absolute right 20 top 20, padding 4, zIndex 10 — SVG 사람 실루엣 아이콘(흰색)',
        '검색 바: flex 1, flexDirection row, gap 8, backgroundColor rgba(255,255,255,0.06), borderWidth 1, borderColor rgba(255,255,255,0.1), borderRadius 20, paddingHorizontal 14, paddingVertical 14',
        '검색 바 아이콘: 돋보기 SVG width/height 13, fill rgba(255,255,255,0.3)',
        '검색 바 placeholder: "매장명 · 카테고리 · 호수로 검색", fontSize 14, Pretendard-Regular, color rgba(255,255,255,0.55)',
        '지도 버튼: flexDirection row, alignItems center, gap 6, backgroundColor rgba(255,255,255,0.05), borderWidth 1, borderColor rgba(255,255,255,0.1), borderRadius 20, paddingHorizontal 11, alignSelf stretch',
        '지도 버튼 텍스트: "지도", fontSize 14, Pretendard-Regular, color rgba(255,255,255,0.65)',
      ]),
      h3('UX'),
      bullets([
        '검색 바는 Pressable — 직접 텍스트 입력 불가, 탭 시 /search 화면으로 이동',
        '지도 버튼 탭 시 /map 화면으로 이동',
        '마이페이지 아이콘 탭 시 /mypage 화면으로 이동',
      ]),
      h3('정책'),
      bullets([
        '히어로 영역은 항상 다크 배경(#0A0A0A) — 라이트 모드 전환 없음',
        '검색 바는 인라인 입력 필드가 아닌 Pressable 컴포넌트로 구현',
        '배경 데코 텍스트는 장식용으로 pointerEvents 없음',
      ]),

      h2('유저는 카테고리 그리드에서 원하는 카테고리를 탭해 해당 검색 결과로 이동할 수 있다'),
      h3('UI'),
      bullets([
        '컨테이너: flexDirection row, flexWrap wrap, backgroundColor #FFFFFF, paddingHorizontal 20, paddingTop 8, paddingBottom 4',
        '각 셀: width 25% (4열 그리드), paddingVertical 14, paddingHorizontal 4, alignItems center, gap 7',
        '아이콘 컨테이너: width 60, height 60, borderRadius 16, backgroundColor #F5F5F5',
        '카테고리 레이블: fontSize 13, Pretendard-Medium, color #1A1A1A, letterSpacing -0.2',
      ]),
      h3('UX'),
      bullets([
        '카테고리 탭 시 /search?q={카테고리명} 으로 이동 — URL 인코딩 적용',
        '이동 후 검색 화면에서 해당 카테고리로 즉시 검색 실행',
      ]),
      h3('정책'),
      table(
        ['카테고리명', '아이콘 파일', '아이콘 크기(px)'],
        [
          ['직물', 'assets/icons/직물.png', '39'],
          ['니트', 'assets/icons/니트.png', '43'],
          ['레이스', 'assets/icons/레이스.png', '47'],
          ['피혁', 'assets/icons/피혁.png', '47'],
          ['실', 'assets/icons/실.png', '43'],
          ['단추', 'assets/icons/단추.png', '45'],
          ['지퍼', 'assets/icons/지퍼.png', '45'],
          ['부자재', 'assets/icons/부자재.png', '45'],
        ]
      ),

      h2('유저는 프로모 배너에서 현재 진행 중인 전시·이벤트 정보를 확인할 수 있다'),
      h3('UI'),
      bullets([
        '컨테이너: marginHorizontal 20, marginTop 8, borderRadius 14, overflow hidden, backgroundColor #111111, height 110',
        '장식 원 1: position absolute top -20 right -14, width 100, height 100, borderRadius 50, borderWidth 1.5, borderColor rgba(255,255,255,0.08)',
        '장식 원 2: position absolute top -6 right 0, width 72, height 72, borderRadius 36, borderWidth 1, borderColor rgba(255,255,255,0.1)',
        '장식 사각형: position absolute right 14, top 50%, width 44, height 44, borderWidth 2, borderColor rgba(167,139,255,0.3), borderRadius 4, rotate 25deg',
        '배지 "전시 진행중": backgroundColor rgba(255,255,255,0.07), borderRadius 20, paddingHorizontal 8, paddingVertical 3, borderWidth 1, borderColor rgba(255,255,255,0.13)',
        '배지 텍스트: fontSize 12, Pretendard-SemiBold, color rgba(255,255,255,0.7)',
        '타이틀 "S/S 2026  패션 트렌드 전시": fontSize 17, Pretendard-ExtraBold, color #FFFFFF, letterSpacing -0.5',
        '날짜 텍스트: fontSize 12, Pretendard-Regular, color rgba(255,255,255,0.32)',
        'CTA "자세히 보기 →": fontSize 12, Pretendard-SemiBold, color rgba(255,255,255,0.48)',
      ]),
      h3('UX'),
      bullets([
        '배너는 단일 정적 배너로 자동 슬라이드 없음 (Pressable 1개)',
        '배너 탭 시 반응 있으나 현재 연결 미구현(placeholder) — 탭 이벤트 핸들러 없음',
      ]),
      h3('정책'),
      bullets([
        '배너 콘텐츠(제목·날짜·링크)는 하드코딩 정적 데이터 — 서버 연동 미구현',
        '배너 탭 액션은 준비 중으로 별도 라우팅 없음',
      ]),

      h2('유저는 편의시설 카드를 탭해 각 시설 상세 화면으로 빠르게 이동할 수 있다'),
      h3('UI'),
      bullets([
        '2칸 그리드(셰어라운지·무신사스튜디오): flexDirection row, gap 10, paddingHorizontal 20, paddingTop 16',
        '2칸 카드: flex 1, backgroundColor #F8F8F8, borderRadius 14, padding 14, borderWidth 1, borderColor #E5E5E5',
        '2칸 카드 emoji: fontSize 28, marginBottom 8',
        '시설명: fontSize 16, Pretendard-Bold, color #1A1A1A, letterSpacing -0.3',
        'desc: fontSize 13, Pretendard-Regular, color #666666, marginTop 3',
        'location: fontSize 13, Pretendard-Regular, color #999999, marginTop 5',
        '3칸 그리드(업무공간·제작·유통 / 식음료·편의시설·기타): flexDirection row, gap 8, paddingHorizontal 20, paddingTop 10',
        '3칸 카드: flex 1, backgroundColor #F8F8F8, borderRadius 12, paddingVertical 14, paddingHorizontal 8, borderWidth 1, borderColor #E5E5E5, alignItems center, gap 6',
        '3칸 카드 emoji: fontSize 24',
        '3칸 카드 이름: fontSize 14, Pretendard-SemiBold, color #1A1A1A, letterSpacing -0.2, textAlign center',
        '하단 3칸 그리드: paddingBottom 36',
      ]),
      h3('UX'),
      bullets([
        '셰어라운지 카드 탭 → /facilities/sharelounge 이동',
        '무신사스튜디오 카드 탭 → /facilities/musinsa 이동',
        '업무공간 탭 → /facilities/workspace 이동',
        '제작 탭 → /facilities/production 이동',
        '유통 탭 → /facilities/distribution 이동',
        '식음료 탭 → /facilities/food 이동',
        '편의시설 탭 → /facilities/hospital 이동',
        '"기타" 탭 시 Alert.alert("준비 중", "서비스를 준비 중입니다.") 표시 — 라우팅 없음',
      ]),
      h3('정책'),
      table(
        ['카드', '위치', '이모지', '설명', '라우트'],
        [
          ['셰어라운지', '4층', '🧵', '나만의 사무/작업실', '/facilities/sharelounge'],
          ['무신사스튜디오', '4층', '🏢', '패션특화 공유오피스', '/facilities/musinsa'],
          ['업무공간', '-', '💼', '-', '/facilities/workspace'],
          ['제작', '-', '👗', '-', '/facilities/production'],
          ['유통', '-', '🚚', '-', '/facilities/distribution'],
          ['식음료', '-', '🍜', '-', '/facilities/food'],
          ['편의시설', '-', '🏥', '-', '/facilities/hospital'],
          ['기타', '-', '➕', '-', '(준비 중)'],
        ]
      ),
    ),
  },

  // ── 지도 화면 탐색 ──────────────────────────────────────────────────────────

  {
    title: '지도 화면 탐색 정책',
    slug: 'map-navigation',
    domain: 'screen-ux',
    features: ['map'],
    content: doc(

      h2('유저는 지도를 핀치줌과 드래그로 자유롭게 탐색하고 지도 배경 탭으로 UI를 숨길 수 있다'),
      h3('UI'),
      bullets([
        'SVG 캔버스 기준 크기: B1~6층은 store_boxes.json 기준(BOXES_SVG_W × BOXES_SVG_H), 7층 이상은 FLOOR_DATA 기준(1170×830px)',
        '배경 색상: #F5F5F0',
        'B1~6층: PNG 도면 이미지를 SVG Image로 렌더링(preserveAspectRatio none) + store_boxes 오버레이',
        '7층 이상: FLOOR_DATA 좌표 배열 기반 SVG Rect 직접 렌더링',
        '초기 viewBox: x=BOXES_SVG_W×0.25, y=BOXES_SVG_H×0.2, w=BOXES_SVG_W/6, h=BOXES_SVG_H/6',
        'UI(헤더·층 선택기·건물 칩): opacity + translateY 180ms 애니메이션으로 숨김/표시 전환',
      ]),
      h3('UX'),
      bullets([
        '핀치줌: 두 손가락 거리 비율로 viewBox width/height 비례 조정',
        '드래그(1터치): pageX/pageY 델타를 viewBox 좌표계로 변환하여 이동',
        '지도 배경 탭 → UI(플로팅 헤더·층 선택기·건물 칩) 숨김/표시 토글',
        '매장 셀 탭 → justPressedBox ref로 배경 탭과 구분, 카드 슬라이드업',
      ]),
      h3('정책'),
      bullets([
        '줌 범위: 최소 SVG_W/5 ~ 최대 SVG_W (각 축 독립 클램프)',
        'PanResponder로 모든 터치 이벤트 처리 — React Native Gesture Handler 미사용',
        '하이라이트 없는 매장(isDimmed): baseOpacity × 0.2로 dimming',
      ]),

      h2('유저는 건물 칩을 탭해 특정 동의 매장만 강조해서 볼 수 있다'),
      h3('UI'),
      bullets([
        '위치: 플로팅 헤더 아래, 가로 스크롤 ScrollView',
        'contentContainerStyle: paddingHorizontal 12, paddingVertical 8, gap 8',
        '칩 기본: paddingHorizontal 16, paddingVertical 8, borderRadius 20, borderWidth 1, borderColor #E5E5E5, backgroundColor #FFFFFF, elevation 3',
        '칩 활성: backgroundColor #D8D8D8, borderColor #BBBBBB',
        '칩 텍스트: fontSize 13, Pretendard-Medium, color #666666 (기본) / #0A0A0A (활성)',
        '필터 아이콘 버튼: 건물 칩 행 맨 우측, paddingHorizontal 10, paddingVertical 7, borderRadius 20, borderWidth 1, borderColor #E5E5E5, backgroundColor #FFFFFF, elevation 3',
      ]),
      h3('UX'),
      bullets([
        '"전체" 탭 → 모든 동 동일 opacity 표시',
        '특정 동 탭 → 해당 동의 매장 영역으로 viewBox 자동 이동 (줌 레벨 유지)',
        '필터 아이콘 버튼 탭 → 필터 바텀시트 열기, 편의시설 시트는 자동 닫힘',
        '필터 시트 열림 시 필터 아이콘 버튼 chipActive 스타일 적용',
      ]),
      h3('정책'),
      table(
        ['동 이름', '내부 zone 키', '매장 색상'],
        [
          ['A동', 'A', '#1A5A9A (파랑)'],
          ['B동', 'B', '#C83252 (빨강)'],
          ['C동', 'C', '#2C8A47 (초록)'],
          ['신관', 'N', '#C8960A (황금)'],
        ]
      ),

      h2('유저는 층 선택기로 현재 보고 있는 층을 빠르게 전환할 수 있다'),
      h3('UI'),
      bullets([
        '위치: 지도 좌측 고정, left 8, 수직 중앙 정렬 (paddingBottom 120)',
        '컨테이너: width 44, height 308, borderRadius 12, backgroundColor #FFFFFF, overflow hidden, elevation 3',
        '각 행: width 44, height 44, alignItems center, justifyContent center',
        '행 텍스트: fontSize 13, Pretendard-SemiBold, color #666666',
        '선택된 층: backgroundColor #D8D8D8, 텍스트 color #0A0A0A',
        '스크롤 상단/하단 페이드 그라디언트 + 화살표 아이콘 표시 (스크롤 가능 방향 시각화)',
      ]),
      h3('UX'),
      bullets([
        '층 탭 → 해당 층으로 전환 (viewBox 비율 유지, 새 층 SVG 캔버스 크기에 맞게 좌표 보정)',
        '초기 스크롤 위치: 5층(index 4)이 보이도록 y=4×44=176으로 scrollTo (100ms 지연)',
        '층 전환 시 store_boxes 있는 층(B1~6층): PNG 도면 + store_boxes 오버레이 렌더링',
        '층 전환 시 store_boxes 없는 층(7층~): FLOOR_DATA 좌표 기반 SVG Rect 렌더링',
      ]),
      h3('정책'),
      bullets([
        '층 목록(위→아래): 9층, 8층, 7층, 6층, 5층, 4층, 3층, 2층, 1층, B1 (총 10개)',
        'store_boxes 데이터 있는 층: b1, 1, 2, 3, 4, 5, 6 (총 7개)',
        'store_boxes 없는 층(7층, 8층, 9층): FLOOR_DATA 기반 렌더링',
      ]),

      h2('유저는 매장 셀을 탭해 하단 카드로 기본 정보를 확인하고 상세 화면으로 이동할 수 있다'),
      h3('UI'),
      bullets([
        '카드 위치: position absolute, bottom 20, left 16, right 16',
        '카드: backgroundColor #FFFFFF, borderRadius 16, borderWidth 1, borderColor #EEEEEE, paddingTop 18, paddingHorizontal 18, paddingBottom 18, elevation 8',
        '닫기 버튼: position absolute top 16 right 16, width 44, height 44 — "✕" 텍스트',
        '매장 코드: fontSize 10, Pretendard-Regular, color #AAAAAA, letterSpacing 0.5',
        '매장명: fontSize 20, Pretendard-ExtraBold, color #0A0A0A, marginBottom 8',
        '메타 행: 카테고리(fontSize 13, color #555555) + 점 구분자(3×3px 원) + 영업상태',
        '영업중: color #2C8A47 / 영업종료: color #999999, 둘 다 Pretendard-SemiBold',
        '"›" 화살표: 상세 정보 있는 매장(id !== -1)만 표시',
        '"X층으로 이동" 버튼: backgroundColor #F0F9FF, borderColor #BAE6FD, color #0369A1 — 다른 층 매장 선택 후 층 전환 시에만 표시',
        '선택된 셀 스타일: fill rgba(255,255,255,0.15), stroke #FFFFFF, strokeWidth 2.5',
      ]),
      h3('UX'),
      bullets([
        '매장 셀 탭 → 하단 카드 슬라이드업, 해당 매장 building으로 activeBuilding 자동 전환',
        '카드 탭(id !== -1) → /stores/:id 이동',
        '카드 탭(id === -1, 팬텀 매장) → 이동 없음',
        '"✕" 버튼 탭 → 카드 닫힘, 선택 해제',
        '지도 배경 탭 → 카드 닫힘 + UI 토글 동시 실행',
      ]),
      h3('정책'),
      bullets([
        'id === -1인 매장: store_boxes에는 있지만 실제 데이터 없는 팬텀 매장 — 코드 기반 이름/카테고리 자동 생성',
        '팬텀 매장은 상세 화면 이동 불가, "›" 화살표 미표시',
        '영업상태(isOpen): store_boxes 데이터에서 결정, 팬텀 매장은 코드 해시 기반 랜덤 결정',
      ]),

      h2('유저는 편의시설 버튼을 탭해 층별 편의시설 위치 정보를 확인할 수 있다'),
      h3('UI'),
      bullets([
        '편의시설 버튼: 층 선택기 컨테이너 아래 gap 8, width 44, height 44, borderRadius 12, backgroundColor #FFFFFF, borderWidth 1, borderColor #E5E5E5, elevation 3',
        '버튼 텍스트: "편의", fontSize 13, Pretendard-SemiBold, color #555555',
        '바텀시트: 배경 딤 없이 지도 위 표시 (facilitySheetWrap: position absolute left 0 right 0 bottom 0, zIndex 21)',
        '시트: backgroundColor #FFFFFF, borderTopLeftRadius 20, borderTopRightRadius 20, paddingTop 12, paddingHorizontal 20, paddingBottom 40',
        '핸들: width 36, height 4, borderRadius 2, backgroundColor #E0E0E0, 중앙 정렬, marginBottom 20',
        '항목 카드: paddingHorizontal 14, paddingVertical 10, borderRadius 16, borderWidth 1, borderColor #E5E5E5, minWidth 80',
        '선택된 항목: backgroundColor #D8D8D8, borderColor #BBBBBB',
      ]),
      h3('UX'),
      bullets([
        '편의시설 버튼 탭 → 편의시설 바텀시트 열기, 필터 시트 자동 닫힘',
        '항목 탭 → 해당 시설 선택/해제 토글 (selectedFacility state)',
        '편의시설 시트는 딤 없이 열려 지도 브라우징 가능',
      ]),
      h3('정책'),
      bullets([
        '편의시설 항목(6개): 화장실, ATM, 엘리베이터, 에스컬레이터, 흡연실, 계단',
        '선택 시 지도 위 시설 위치 표시 기능은 현재 미구현 (selectedFacility state만 관리)',
      ]),
    ),
  },

  // ── 지도 검색 ───────────────────────────────────────────────────────────────

  {
    title: '지도 화면 검색 정책',
    slug: 'map-search',
    domain: 'screen-ux',
    features: ['map'],
    content: doc(

      h2('유저는 지도 플로팅 헤더의 검색 바를 탭해 전체 화면 검색 오버레이를 열 수 있다'),
      h3('UI'),
      bullets([
        '플로팅 헤더 위치: position absolute, top: insets.top, left 0, right 0, zIndex 20, height 60',
        '레이아웃: flexDirection row, alignItems center, paddingHorizontal 12, gap 8',
        'searchBtnWrapper: flex 1, height 48, position relative',
        '뒤로가기 버튼: position absolute left 0 top 0, width 44, height 48, zIndex 1 — chevron left SVG',
        '검색 바: position absolute left 0 right 0, backgroundColor #FFFFFF, borderRadius 22, paddingLeft 56, paddingRight 12, elevation 3',
        '검색 바 placeholder: "매장명 · 카테고리 · 호수로 검색", fontSize 15, Pretendard-Regular, color #AAAAAA',
        '"내 위치" 버튼: height 48, paddingHorizontal 14, borderRadius 24, borderWidth 1, borderColor #E5E5E5, backgroundColor #FFFFFF, elevation 3',
        '핀 설정 시 "내 위치" 버튼 chipActive 스타일(backgroundColor #D8D8D8, borderColor #BBBBBB) 적용',
        'UI 애니메이션: opacity + translateY -70~0, duration 180ms',
      ]),
      h3('UX'),
      bullets([
        '검색 바 탭 → 전체 화면 검색 오버레이(zIndex 100) 열기, 100ms 후 자동 포커스',
        '"내 위치" 버튼 탭 → 내위치 바텀시트 열기',
        '뒤로가기 버튼 탭 → router.back()',
      ]),
      h3('정책'),
      bullets([
        '플로팅 헤더는 지도 배경 탭 시 animateOut, 재탭 시 animateIn',
        '헤더 숨김 상태(uiVisible false)에서는 pointerEvents none 적용',
      ]),

      h2('유저는 지도 검색 오버레이에서 매장명·카테고리·호수로 검색하고 결과를 지도에 하이라이트할 수 있다'),
      h3('UI'),
      bullets([
        '오버레이: position absolute top 0 left 0 right 0 bottom 0, backgroundColor #FFFFFF, zIndex 100',
        '헤더: flexDirection row, alignItems center, paddingHorizontal 12, paddingBottom 8, gap 8, borderBottomWidth 1, borderBottomColor #F0F0F0',
        '헤더 paddingTop: insets.top + 8',
        '뒤로가기 버튼: width 40, height 40',
        '검색 입력: flex 1, height 40, fontSize 15, Pretendard-Regular',
        '지우기 버튼 "×": mapQuery.length > 0일 때만 표시',
        '결과 각 행: paddingVertical 14, paddingHorizontal 16, borderBottomColor #F5F5F5',
        '왼쪽: 코드(fontSize 11, color #999999) + 이름(fontSize 15, Pretendard-Medium)',
        '오른쪽 메타: fontSize 12, color #AAAAAA — "{건물} · {카테고리}"',
        '"지도에서 보기 (N개)" 버튼: margin 16, paddingVertical 14, backgroundColor #0A0A0A, borderRadius 12',
      ]),
      h3('UX'),
      bullets([
        '오버레이 열릴 때 100ms 후 검색 입력 자동 포커스',
        '개별 매장 탭 → 해당 매장만 searchHighlight Set에 추가 → 지도 단일 하이라이트 → 오버레이 닫힘',
        '"지도에서 보기 (N개)" 버튼 탭 → 전체 결과 searchHighlight Set에 추가 → 오버레이 닫힘',
        'Enter(returnKeyType search) → 전체 결과 하이라이트 적용',
        '"×" 버튼 탭 → mapQuery 초기화',
        '뒤로가기 버튼 탭 → showMapSearch false + mapQuery 초기화',
      ]),
      h3('정책'),
      bullets([
        '검색 대상 필드: name(매장명), category(카테고리), subCategory(세부 카테고리), code(호수 코드)',
        '결과 최대 30개 표시 (.slice(0, 30))',
        '결과 없음 시: "검색 결과가 없습니다" (padding 40)',
        'FlatList keyboardShouldPersistTaps handled 설정',
      ]),

      h2('유저는 검색 결과를 지도 위 하이라이트와 배지로 한눈에 파악할 수 있다'),
      h3('UI'),
      bullets([
        '하이라이트된 매장: fill rgba(255,180,0,0.35), stroke #FFB400, strokeWidth 2',
        '하이라이트 안 된 매장: baseOpacity × 0.2로 dimming',
        '선택된 매장(selectedCode): fill rgba(255,255,255,0.15), stroke #FFFFFF, strokeWidth 2.5',
        '검색 결과 배지: position absolute, top: insets.top + 60, left 12, zIndex 21',
        '배지: backgroundColor #FFFFFF, borderRadius 20, paddingHorizontal 12, paddingVertical 6, elevation 3',
        '배지 텍스트: "{activeSearchQuery}" · {N}개',
        '"×" 버튼: marginLeft 6, fontSize 14, color #666',
      ]),
      h3('UX'),
      bullets([
        '검색 적용 → 배지 표시, 하이라이트 활성화',
        '배지 "×" 탭 → searchHighlight null, activeSearchQuery 초기화 → 하이라이트 해제',
      ]),
      h3('정책'),
      bullets([
        'searchHighlight null: 모든 매장 정상 opacity',
        'searchHighlight Set이지만 결과 0개: 하이라이트 적용 안 함 (handleApplyFilter에서 results.length > 0 조건)',
      ]),

      h2('유저는 필터 바텀시트로 카테고리와 동·층을 복합 필터링해 지도에서 결과를 볼 수 있다'),
      h3('UI'),
      bullets([
        '배경 딤(sheetOverlay): position absolute, backgroundColor rgba(0,0,0,0.4) — 딤 탭 시 시트 닫힘',
        '시트: filterSheet maxHeight 72%',
        '헤더: "필터" 제목 + "초기화" 버튼(fontSize 13, Pretendard-Regular, color #999999)',
        '탭 행: 카테고리 탭 / 동·층 탭 — 선택된 탭: borderBottomWidth 2, borderBottomColor #0A0A0A',
        '콘텐츠 영역: 고정 height 360 (탭 전환 시 높이 변화 없음)',
        '필터 칩: paddingHorizontal 14, paddingVertical 8, borderRadius 20, borderWidth 1, borderColor #E5E5E5',
        '활성 칩(대분류): backgroundColor #0A0A0A, borderColor #0A0A0A, 텍스트 color #FFFFFF, Pretendard-SemiBold',
        '"지도에서 보기" 버튼: marginHorizontal 0, marginTop 8, paddingVertical 14, backgroundColor #0A0A0A, borderRadius 12',
      ]),
      h3('UX'),
      bullets([
        '대분류 탭 → filterCategory 변경 + filterSubCategories 초기화 (세부 카테고리 목록 교체)',
        '세부 카테고리 탭 → Set에 추가/제거 (다중 선택)',
        '"전체" 동 탭 → filterBuildings Set 초기화',
        '특정 동 탭 → 해당 동만의 층 목록 표시 (FILTER_FLOORS 매핑)',
        '"전체" 층 탭 → filterFloors Set 초기화',
        '"지도에서 보기" 버튼 탭 → 필터 적용 + 결과 하이라이트 + 시트 닫힘',
        '"초기화" 탭 → filterTab="category", filterCategory="직물", 모든 Set 초기화',
      ]),
      h3('정책'),
      bullets([
        '대분류는 항상 1개 이상 선택 유지 — 현재 선택된 것을 다시 탭해도 해제 불가',
        '세부 카테고리: 다중 선택 가능, 대분류 변경 시 세부 카테고리 초기화',
        '동/층은 다중 선택 가능, "전체" 선택 시 Set 초기화(개별 선택 모두 해제)',
        '동 미선택 시 전체 층 목록 표시 (B1, 1~9 총 10개)',
      ]),
    ),
  },

  // ── 내위치 확인 ─────────────────────────────────────────────────────────────

  {
    title: '내위치 확인 정책',
    slug: 'my-location',
    domain: 'screen-ux',
    features: ['map'],
    content: doc(

      h2('유저는 드럼 피커로 동·층을 선택하고 호수를 입력해 자신의 위치를 지도 위 핀으로 표시할 수 있다'),
      h3('UI'),
      bullets([
        '바텀시트: backgroundColor #FFFFFF, borderTopLeftRadius 20, borderTopRightRadius 20, paddingTop 12, paddingHorizontal 20, paddingBottom 40',
        '제목: "내 위치 설정", fontSize 17, Pretendard-Bold',
        '라벨 행: "동" / "층" / "호수", fontSize 12, Pretendard-Regular, color #888888',
        '피커 행: 동(flex 1) + 층(flex 1) + 호수 입력(flex 1.8), gap 4',
        '드럼 피커: height ITEM_H×3 = 132px (3개 항목 표시), overflow hidden',
        '아이템 높이(ITEM_H): 44px',
        '중앙 강조선: position absolute top 44, left 12, right 12, height 44, borderTopWidth 1, borderBottomWidth 1, borderColor #E0E0E0',
        '상단/하단 페이드: LinearGradient 흰색→투명/투명→흰색, height ITEM_H×1.2 = 52.8px',
        '선택된 아이템: fontSize 16, Pretendard-Bold, color #0A0A0A, opacity 1',
        '비선택 아이템: fontSize 16, Pretendard-Regular, color #0A0A0A, opacity 0.35',
        '호수 입력: borderWidth 1, borderColor #E5E5E5(정상) / #FF3B30(오류), borderRadius 10, paddingHorizontal 12, paddingVertical 14, fontSize 16, textAlign center',
        'placeholder: "예) 001", placeholderTextColor #CCCCCC',
        '오류 메시지: "호수를 찾을 수 없습니다", fontSize 12, color #FF3B30, marginTop 6, textAlign center',
      ]),
      h3('UX'),
      bullets([
        '드럼 피커: snapToInterval 44, decelerationRate fast, contentContainerStyle paddingVertical 44',
        '동 변경 → 층 목록 재계산, 이전 층이 새 동에 없으면 첫 번째 층으로 초기화, hosuInput 초기화',
        '층 변경 → hosuInput 초기화',
        '"확인" 버튼 탭 → 호수 padStart(3,"0") 처리 후 코드 조합 → store_boxes 검색',
        '매장 찾음 → 핀 설정, 바텀시트 닫힘, 층 자동 전환, viewBox 핀 위치로 이동',
        '매장 없음 → hosuError true, 인라인 오류 텍스트 표시, borderColor #FF3B30',
        '핀 설정 시 "핀 제거" 버튼 추가(flex 1) + "확인" 버튼(flex 2) 배치',
        '"핀 제거" 탭 → pinnedLocation null 처리',
        '배경 딤 탭 → 바텀시트 닫힘',
      ]),
      h3('정책'),
      bullets([
        '호수 입력 방식: TextInput (keyboardType numeric) — 최대 4자리',
        '코드 조합 규칙: {동}{층키}{호수 padStart 3자리} 예) A1001 (A동 1층 001호)',
        '층키 변환: b1 → "B1", 나머지는 숫자 그대로',
        '오류 메시지 입력 변경 시 hosuError false로 초기화',
      ]),

      h2('유저는 동 피커의 각 동별 층 목록을 확인하고 올바른 호수를 입력할 수 있다'),
      h3('UI'),
      bullets([
        '동 피커 suffix: "동" 접미사 표시',
        '층 피커 suffix: "층" 접미사 표시, b1은 "지하1층"으로 표시',
        '피커 항목: 동 피커 항목에 "동" 붙임, 층 피커는 floorKeyToLabel 함수로 변환',
      ]),
      h3('UX'),
      bullets([
        '동 피커 항목: A, B, C, N (4개) — 실제 표시는 "A동", "B동", "C동", "N동"',
        '층 피커: 동 변경 시 ZONE_FLOORS 매핑에서 해당 동 층 목록으로 재렌더링',
      ]),
      h3('정책'),
      table(
        ['동', '층 목록 (위에서 아래)'],
        [
          ['A동', '7, 6, 5, 4, 3, 2, 1, b1(지하1)'],
          ['B동', '6, 5, 4, 3, 2, 1, b1(지하1)'],
          ['C동', '6, 5, 4, 3, 2, 1, b1(지하1)'],
          ['N(신관)', '9, 8, 7, 6, 5, 4, 3, 2, 1, b1(지하1)'],
        ]
      ),

      h2('유저는 설정된 핀 마커를 지도 위에서 시각적으로 확인하고 제거할 수 있다'),
      h3('UI'),
      bullets([
        'SVG G transform: translate(svgX, svgY) scale(0.6)',
        '마커 몸통: 물방울 Path, fill #FF3B30, stroke #FFFFFF, strokeWidth 2',
        '마커 중심 원: r 5, fill #FFFFFF',
        '"내 위치" 버튼: 핀 설정 시 chipActive 스타일 적용(backgroundColor #D8D8D8)',
      ]),
      h3('UX'),
      bullets([
        '핀 설정 → viewBox가 핀 위치로 자동 이동 (줌 레벨 유지)',
        '"내 위치" 버튼 탭(핀 설정 상태) → 내위치 바텀시트 열기 (핀 제거 버튼 표시)',
        '"핀 제거" 탭 → 핀 삭제, "내 위치" 버튼 일반 스타일 복원',
      ]),
      h3('정책'),
      bullets([
        '동별 ZONE_VIEWPORT_OFFSET: A {x:550, y:-300} / B {x:-550, y:-300} / C {x:0, y:-170} / N {x:0, y:0}',
        '핀 좌표: found.svgX + found.svgW/2, found.svgY + found.svgH/2 - 10',
        '핀은 층당 1개만 유지 — 새 핀 설정 시 기존 핀 덮어쓰기',
      ]),
    ),
  },

  // ── 검색 화면 ───────────────────────────────────────────────────────────────

  {
    title: '검색 화면 정책',
    slug: 'search-screen',
    domain: 'screen-ux',
    features: ['search'],
    content: doc(

      h2('유저는 검색 화면 진입 시 키보드가 자동 열리고 매장명·카테고리·호수로 검색할 수 있다'),
      h3('UI'),
      bullets([
        '헤더: height 60, paddingHorizontal 12, flexDirection row, alignItems center, gap 8, borderBottomColor #F2F2F2',
        '뒤로가기 버튼: width 36, height 36',
        '검색 바 컨테이너: flex 1, flexDirection row, alignItems center, backgroundColor #F5F5F5, borderRadius 22, paddingHorizontal 12, paddingVertical 14, gap 8',
        '검색 입력: fontSize 15, Pretendard-Regular, color #0A0A0A',
        'placeholder: "매장명 · 카테고리 · 호수로 검색", placeholderTextColor #AAAAAA',
        '지우기 버튼 "✕": query.length > 0일 때만 표시, fontSize 14, color #AAAAAA',
      ]),
      h3('UX'),
      bullets([
        'q 파라미터 없이 진입 → inputRef.current?.focus() 자동 포커스 (키보드 자동 오픈)',
        'q 파라미터 있이 진입(/search?q=카테고리명) → query + submittedQuery 초기화, 자동 포커스 없음, 즉시 검색 실행',
        '"✕" 버튼 탭 → query, submittedQuery, selectedBuilding 모두 초기화, 초기 화면 복귀',
        'Enter(returnKeyType search) → handleSubmit 실행',
        '포커스 해제(blur) → 150ms setTimeout으로 지연 처리 (자동완성 탭 처리 목적)',
      ]),
      h3('정책'),
      bullets([
        '검색 대상 필드: name, category, subCategory, code (code는 includes 매칭)',
        'submittedQuery: 실제 검색 실행 기준값 (query와 별도 관리)',
        'openOnly 필터: 코드에 파라미터 존재하나 현재 항상 false',
      ]),

      h2('유저는 자동완성 제안 목록에서 원하는 검색어를 빠르게 선택할 수 있다'),
      h3('UI'),
      bullets([
        '표시 조건: isFocused === true AND query.trim().length > 0 AND suggestions.length > 0',
        '위치: position absolute, top 60, left 0, right 0, zIndex 20',
        '스타일: backgroundColor #FFFFFF, borderBottomWidth 1, borderBottomColor #E8E8E8, elevation 4',
        '각 항목: height 44, paddingHorizontal 16, borderBottomColor #F5F5F5',
        '항목 텍스트: fontSize 14, Pretendard-Regular, color #0A0A0A',
      ]),
      h3('UX'),
      bullets([
        '자동완성 항목 탭 → setQuery + setSubmittedQuery + blur (즉시 검색 실행, 키보드 닫힘)',
      ]),
      h3('정책'),
      bullets([
        '최대 6개 항목 표시 (getSuggestions().slice(0, 6))',
        '제안 생성 순서: 인기 검색어(POPULAR_TERMS) → 매장명 → 카테고리 → 세부 카테고리',
        '인기 검색어(고정 10개): 면직물, 폴리에스터, 레이스, 니트, 실크, 지퍼, 단추, 안감, 자수, 데님',
      ]),

      h2('유저는 검색 전 최근 검색어와 인기 검색어를 보고 탭해 빠르게 검색할 수 있다'),
      h3('UI'),
      bullets([
        '표시 조건: submittedQuery.trim().length === 0',
        '최근 검색어 섹션: 리스트 형태, 각 항목 paddingVertical 12, borderBottomWidth 1, borderBottomColor #F5F5F5, fontSize 15',
        '인기 검색어 섹션: 태그 형태 flexWrap wrap, gap 8',
        '태그: paddingHorizontal 14, paddingVertical 8, borderRadius 20, borderWidth 1, borderColor #E8E8E8, fontSize 15',
        '섹션 타이틀: fontSize 13, Pretendard-Bold, color #AAAAAA, letterSpacing 0.5',
      ]),
      h3('UX'),
      bullets([
        '최근 검색어/인기 검색어 항목 탭 → handleSuggestionPress 실행 (즉시 검색 실행)',
      ]),
      h3('정책'),
      bullets([
        '최근 검색어: RECENT_TERMS 하드코딩 배열 (폴리에스터 원단, A동 3층, 화섬, 면직물 — 총 4개)',
        '최근 검색어 로컬 저장소 연동 미구현 — 항상 고정값 표시',
      ]),

      h2('유저는 검색 결과를 동 필터 칩으로 좁히고 2열 카드 목록으로 탐색할 수 있다'),
      h3('UI'),
      bullets([
        '표시 조건: submittedQuery.trim().length > 0',
        '동 필터 칩: 전체 / A동 / B동 / C동 / 신관 — 가로 스크롤, paddingHorizontal 16, paddingVertical 8, gap 8',
        '칩: paddingHorizontal 16, paddingVertical 8, borderRadius 15, borderWidth 1, borderColor #E8E8E8',
        '활성 칩: backgroundColor #D8D8D8, borderColor #BBBBBB',
        '결과 카운트: fontSize 13, color #AAAAAA, 우측 정렬 — N은 Pretendard-Bold color #0A0A0A',
        'FlatList: numColumns 2, columnWrapperStyle gap 8 marginBottom 8, contentContainerStyle paddingHorizontal 12 paddingBottom 100',
        '매장 카드: flex 1, borderRadius 10, backgroundColor #F5F5F5, padding 12',
        '코드: fontSize 10, letterSpacing 2, color #AAAAAA, tabular-nums',
        '매장명: fontSize 16, Pretendard-ExtraBold, color #0A0A0A, numberOfLines 1',
        '메타: fontSize 12, Pretendard-Regular, color #888888 — "{건물} · {카테고리}"',
        'FAB "지도에서 보기": position absolute, bottom 80, alignSelf center, backgroundColor #0A0A0A, paddingHorizontal 24, paddingVertical 14, borderRadius 20, elevation 6',
        'FAB 텍스트: fontSize 14, Pretendard-Bold, color #FFFFFF',
      ]),
      h3('UX'),
      bullets([
        '매장 카드 탭 → /stores/:id로 이동',
        '"지도에서 보기" FAB 탭 → /map으로 이동 (검색어 전달 없음)',
        '동 필터 칩 탭 → selectedBuilding 변경 → 결과 즉시 필터링',
        '결과 없음 → 중앙에 "검색 결과가 없습니다" (paddingVertical 60)',
      ]),
      h3('정책'),
      bullets([
        '"지도에서 보기" FAB 표시 조건: results.length > 0',
        '동 필터는 단일 선택 (radio 방식) — 멀티 선택 불가',
        '"전체" 선택 시 모든 동 포함',
      ]),
    ),
  },

  // ── 매장 상세 ───────────────────────────────────────────────────────────────

  {
    title: '매장 상세 정책',
    slug: 'store-detail',
    domain: 'store',
    features: ['store-detail'],
    content: doc(

      h2('유저는 매장 상세 화면의 히어로 영역에서 매장 코드와 이름을 한눈에 확인할 수 있다'),
      h3('UI'),
      bullets([
        '배경색: #0A0A0A',
        'paddingBottom 24, paddingHorizontal 20, paddingTop: insets.top + 60, gap 6',
        '매장 코드: fontSize 10, letterSpacing 2.5, color rgba(255,255,255,0.5), fontWeight 500, textTransform uppercase',
        '매장명: fontSize 28, fontWeight 800 (ExtraBold), color #FFFFFF, letterSpacing -0.6, lineHeight 34, numberOfLines 2',
        '플로팅 뒤로가기 버튼: position absolute left 16, top: insets.top+8, width 36, height 36, borderRadius 18, backgroundColor rgba(0,0,0,0.4)',
      ]),
      h3('UX'),
      bullets([
        '플로팅 뒤로가기 버튼 탭 → router.back()',
        '매장 없음(id 불일치) → 전체 화면 중앙에 "매장을 찾을 수 없습니다" 텍스트 표시',
      ]),
      h3('정책'),
      bullets([
        'id 파라미터: useLocalSearchParams로 읽음, Number(id)로 변환',
        'getAllStores() 배열에서 id 매칭 — 없으면 notFound 상태',
      ]),

      h2('유저는 정보 행에서 취급품목·영업시간·위치·연락처를 체계적으로 확인할 수 있다'),
      h3('UI'),
      bullets([
        '섹션: paddingHorizontal 20, paddingTop 8',
        '각 행: flexDirection row, paddingVertical 16, alignItems flex-start, gap 12',
        '행 구분선: height 1, backgroundColor #F2F2F2',
        '라벨: fontSize 11, color #AAAAAA, width 52, paddingTop 2',
        '값 영역: flex 1, gap 4',
        '값 텍스트(메인): fontSize 14, color #0A0A0A, fontWeight 500',
        '값 텍스트(보조): fontSize 13, color #888888',
        '카테고리별 취급품목 태그: backgroundColor #F5F5F5, borderRadius 4, paddingHorizontal 8, paddingVertical 3, fontSize 12, color #555',
      ]),
      h3('UX'),
      bullets([
        '각 행은 스크롤 가능한 ScrollView 내에 배치 — 개별 행 탭 액션 없음',
        '연락처 행의 "전화하기" 버튼 탭 → Linking.openURL("tel:{phone}") (하이픈 제거 후 호출)',
      ]),
      h3('정책'),
      table(
        ['카테고리', '취급품목 태그'],
        [
          ['원단', '면, 폴리에스터, 나일론, 울, 실크'],
          ['단추', '플라스틱 단추, 금속 단추, 나무 단추, 자개 단추'],
          ['지퍼', '코일 지퍼, 금속 지퍼, 방수 지퍼, 보이지 않는 지퍼'],
          ['안감', '폴리 안감, 실크 안감, 면 안감, 기모 안감'],
          ['심지', '접착 심지, 봉제 심지, 부직포 심지'],
          ['기타', '레이스, 리본, 테이프, 단열재'],
        ]
      ),

      h2('유저는 지도 미리보기를 탭해 층별 평면도에서 매장 위치를 시각적으로 확인할 수 있다'),
      h3('UI'),
      bullets([
        '컨테이너: flex 1, height 130, backgroundColor #F5F5F5, borderRadius 8, overflow hidden',
        'FLOOR_DATA 있는 층: SVG로 해당 층 구역 렌더링 — 매장 동은 불투명(opacity 1), 다른 동은 opacity 0.2',
        'FLOOR_DATA 없는 층: "X층 안내도 / 탭하여 지도 보기" 텍스트 중앙 표시',
        '위치 레이블 오버레이: position absolute top 8 left 8, backgroundColor rgba(0,0,0,0.5), paddingHorizontal 8, paddingVertical 3, borderRadius 4, fontSize 11, color #FFFFFF',
        'pressed 상태: opacity 0.7',
      ]),
      h3('UX'),
      bullets([
        '지도 미리보기 탭 → /map 이동',
      ]),
      h3('정책'),
      bullets([
        'FLOOR_DATA 키: store.floor === -1 → "b1", 그 외 String(store.floor)',
        'SVG viewBox: "0 0 {fd.w} {fd.h}", preserveAspectRatio xMidYMid meet',
        '동별 색상: A동 #1A5A9A, B동 #C83252, C동 #2C8A47, 신관 #C8960A',
      ]),

      h2('유저는 한 번의 탭으로 매장에 전화를 걸 수 있다'),
      h3('UI'),
      bullets([
        '연락처 라벨: "연락처", fontSize 11, color #AAAAAA, width 52',
        '전화번호 텍스트: fontSize 14, color #0A0A0A, fontWeight 500',
        '"전화하기" 버튼: backgroundColor #F5F5F5, borderRadius 8, paddingHorizontal 12, paddingVertical 8, alignSelf flex-start',
        '버튼 텍스트: fontSize 14, Pretendard-SemiBold, color #0A0A0A',
        'phoneRow: flexDirection row, alignItems center, gap 10',
      ]),
      h3('UX'),
      bullets([
        '"전화하기" 버튼 탭 → Linking.openURL("tel:{phone}") — 하이픈 제거 후 호출',
      ]),
      h3('정책'),
      bullets([
        '전화번호 하이픈 제거: store.phone.replace(/-/g, "")',
        '전화번호 없는 매장: 빈 문자열 표시 (별도 처리 없음)',
      ]),
    ),
  },

  // ── 마이페이지 ──────────────────────────────────────────────────────────────

  {
    title: '마이페이지 정책',
    slug: 'mypage',
    domain: 'membership',
    features: ['mypage'],
    content: doc(

      h2('유저는 마이페이지 헤더에서 화면 제목을 확인하고 이전 화면으로 돌아갈 수 있다'),
      h3('UI'),
      bullets([
        '헤더: height 52, flexDirection row, alignItems center, borderBottomWidth 1, borderBottomColor #F2F2F2',
        '뒤로가기 버튼: paddingHorizontal 16, height 52, justifyContent center — chevron left SVG (width 24, height 24)',
        '제목 "마이페이지": fontSize 16, Pretendard-SemiBold, color #0A0A0A, letterSpacing -0.3 — position absolute로 가운데 정렬',
      ]),
      h3('UX'),
      bullets([
        '뒤로가기 버튼 탭: canGoBack() ? router.back() : router.replace("/(tabs)/home")',
      ]),
      h3('정책'),
      bullets([
        '헤더 제목은 항상 "마이페이지" 고정',
        '뒤로가기 불가능한 경우(탭 직접 접근) → 홈으로 replace',
      ]),

      h2('유저는 계정 카드에서 자신의 계정 정보를 확인하고 수정 화면으로 이동할 수 있다'),
      h3('UI'),
      bullets([
        '카드: flexDirection row, alignItems center, backgroundColor #F8F8F8, borderRadius 14, padding 16, borderWidth 1, borderColor #E5E5E5, gap 12',
        '아바타: width 40, height 40, borderRadius 20, backgroundColor #CCCCCC — SVG 사람 아이콘(흰색)',
        '계정명: fontSize 15, Pretendard-SemiBold, color #0A0A0A, letterSpacing -0.3',
        '이메일: fontSize 13, Pretendard-Regular, color #666666',
        '"계정 수정 ›" 버튼: flexDirection row, alignItems center — 텍스트(fontSize 13, color #666666) + "›"(fontSize 18, color #CCCCCC)',
      ]),
      h3('UX'),
      bullets([
        '"계정 수정 ›" 탭 → /mypage/account-edit 이동',
      ]),
      h3('정책'),
      bullets([
        '계정명·이메일: 현재 하드코딩(홍길동, hong@example.com) — 서버 연동 미구현',
      ]),

      h2('유저는 경력 불러오기 섹션에서 패션 경력을 인증하고 프로필에 추가할 수 있다'),
      h3('UI'),
      bullets([
        '제목 "경력 불러오기": fontSize 16, Pretendard-SemiBold, color #0A0A0A, letterSpacing -0.3',
        '설명: "나의 패션 경력을 인증하고 프로필에 추가하세요.", fontSize 14, Pretendard-Regular, color #666666, lineHeight 20',
        '"경력 불러오기 →" 버튼: marginTop 10, backgroundColor #0A0A0A, borderRadius 10, height 48, alignItems center, justifyContent center',
        '버튼 텍스트: fontSize 15, Pretendard-SemiBold, color #FFFFFF, letterSpacing -0.2',
      ]),
      h3('UX'),
      bullets([
        '"경력 불러오기 →" 버튼 탭 → /mypage/identity-verify 이동',
      ]),
      h3('정책'),
      bullets([
        '경력 인증 기능: /mypage/identity-verify 화면 구현 필요',
        '현재 인증 플로우 미완성 — 화면 라우팅만 존재',
      ]),

      h2('유저는 메뉴 목록에서 앱 내 주요 정보 화면에 접근할 수 있다'),
      h3('UI'),
      bullets([
        '각 행: flexDirection row, justifyContent space-between, alignItems center, paddingVertical 16, borderBottomWidth 1, borderBottomColor #F2F2F2',
        '마지막 항목: borderBottomWidth 0',
        '라벨: fontSize 15, Pretendard-Medium, color #0A0A0A, letterSpacing -0.2',
        '"›" 화살표: fontSize 20, color #CCCCCC',
      ]),
      h3('UX'),
      bullets([
        '각 메뉴 행 탭 → 해당 라우트로 이동',
      ]),
      h3('정책'),
      table(
        ['메뉴 항목', '라우트'],
        [
          ['이벤트', '/mypage/events'],
          ['공지사항', '/mypage/notices'],
          ['고객센터', '/mypage/support'],
          ['앱 정보', '/mypage/app-info'],
        ]
      ),
    ),
  },

  // ── 셰어라운지 ──────────────────────────────────────────────────────────────

  {
    title: '셰어라운지 정책',
    slug: 'sharelounge',
    domain: 'facilities',
    features: ['sharelounge'],
    content: doc(

      h2('유저는 셰어라운지 화면에서 갤러리 이미지를 가로 스크롤로 탐색하고 시설 기본 정보를 확인할 수 있다'),
      h3('UI'),
      bullets([
        '갤러리: 가로 스크롤 ScrollView, showsHorizontalScrollIndicator false',
        '이미지: width 320, height 220, resizeMode cover',
        '갤러리 이미지 6장 (로컬 PNG 파일 — images/sharelounge/)',
        'contentContainerStyle gap 8',
        '시설명 "셰어라운지": fontSize 22, Pretendard-Bold, color #1A1A1A, marginBottom 8',
        '설명: fontSize 14, Pretendard-Regular, color #666666, lineHeight 22',
        '메타 행: "📍 4층 | 🕐 24시간 운영 | 📋 사전 예약 필요", fontSize 13, color #666666, marginTop 14, flexWrap wrap, gap 8',
      ]),
      h3('UX'),
      bullets([
        '갤러리 이미지는 스크롤만 가능, 탭 시 상세 뷰 없음',
        '헤더 뒤로가기 버튼 탭 → router.back()',
      ]),
      h3('정책'),
      bullets([
        '위치: 4층, 24시간 운영, 사전 예약 필요',
        '시간당 요금: 4,000원 (PRICE_PER_HOUR 상수)',
      ]),

      h2('유저는 시간 이용권에서 바로사용 또는 날짜지정을 선택해 이용 시간을 예약할 수 있다'),
      h3('UI'),
      bullets([
        '"바로사용" / "날짜지정" 버튼: flex 1, paddingVertical 11, borderRadius 10, borderWidth 1, borderColor #E5E5E5, backgroundColor #F8F8F8',
        '선택된 버튼: backgroundColor #0A0A0A, borderColor #0A0A0A, 텍스트 color #FFFFFF',
        '날짜 버튼: paddingHorizontal 14, paddingVertical 10, borderRadius 10, borderWidth 1, borderColor #E5E5E5',
        '시작 시간 버튼: 동일 스타일',
        '이용 시간 그리드: flexDirection row, flexWrap wrap, gap 8, marginTop 16',
        '이용 시간 버튼: width 30%, paddingVertical 12, borderRadius 10, borderWidth 1, borderColor #E5E5E5, backgroundColor #F8F8F8',
        '선택된 버튼: borderColor #BBBBBB, backgroundColor #D8D8D8',
      ]),
      h3('UX'),
      bullets([
        '"바로사용" 탭 → useType="immediate", 이용 시간 그리드 즉시 표시, 시작 시간: 현재 시각 기준 다음 정시 자동 계산',
        '"날짜지정" 탭 → useType="scheduled", 날짜 + 시작 시간 선택 후 이용 시간 그리드 활성화',
        '이용 시간 선택 → selectedPkg 초기화',
        '타입 변경("바로사용"↔"날짜지정") → selectedHours, selectedDate, selectedStartTime 초기화',
      ]),
      h3('정책'),
      bullets([
        '날짜 선택: 오늘 포함 7일, 가로 스크롤 — 형식: MM/DD(요일) 예) 04/21(화)',
        '시작 시간 선택: 09:00~20:00, 1시간 단위 (총 12개)',
        '이용 시간 그리드 활성화 조건: useType="immediate" 또는 (useType="scheduled" AND selectedDate != null AND selectedStartTime != null)',
        '이용 시간: 1~8시간 (총 8개 버튼)',
      ]),

      h2('유저는 패키지를 구매해 더 저렴한 시간당 요금으로 셰어라운지를 이용할 수 있다'),
      h3('UI'),
      bullets([
        '카드: flexDirection row, justifyContent space-between, backgroundColor #F8F8F8, borderRadius 12, padding 16, borderWidth 1, borderColor #E5E5E5, marginBottom 10',
        '선택된 카드: borderColor #BBBBBB, backgroundColor #D8D8D8',
        '왼쪽: "{N}시간권"(fontSize 16, Pretendard-Bold) + "유효기간 {N}일"(fontSize 13, color #999999)',
        '오른쪽: "{N}원"(fontSize 17, Pretendard-Bold) + "{N}원/시간"(fontSize 12, color #999999)',
      ]),
      h3('UX'),
      bullets([
        '패키지 탭 → selectedPkg 변경 + selectedHours/selectedDate/selectedStartTime 초기화',
        '패키지 재탭 → 선택 해제',
      ]),
      h3('정책'),
      table(
        ['패키지', '가격', '유효 기간', '시간당 단가'],
        [
          ['25시간권', '50,000원', '90일', '2,000원/시간'],
          ['50시간권', '100,000원', '180일', '2,000원/시간'],
          ['75시간권', '150,000원', '270일', '2,000원/시간'],
          ['100시간권', '200,000원', '360일', '2,000원/시간'],
        ]
      ),

      h2('유저는 선택 완료 시 하단 패널에서 예상 시간 범위와 합계 금액을 확인하고 결제할 수 있다'),
      h3('UI'),
      bullets([
        '표시 조건: selectedHours !== null OR selectedPkg !== null',
        '컨테이너: backgroundColor #FFFFFF, borderTopWidth 1, borderTopColor #F2F2F2, paddingHorizontal 20, paddingTop 24, gap 14, paddingBottom max(insets.bottom, 16)',
        '시간 범위: 이용 시간권 선택 + 시작 시간 있을 때 "{날짜 }HH:MM → HH:MM", fontSize 14, Pretendard-Medium, color #666666',
        '합계 행: "합계" 레이블(fontSize 14, color #666666) + 금액(fontSize 20, Pretendard-Bold, color #1A1A1A)',
        '"결제하기" 버튼: backgroundColor #0A0A0A, borderRadius 14, paddingVertical 16, alignItems center',
        '버튼 텍스트: fontSize 16, Pretendard-SemiBold, color #FFFFFF',
      ]),
      h3('UX'),
      bullets([
        '"결제하기" 버튼 탭 → Alert.alert("결제", "{N}원을 결제합니다.") (현재 목업)',
      ]),
      h3('정책'),
      bullets([
        '합계 계산: 이용 시간권은 selectedHours × 4,000원, 패키지는 PACKAGES에서 price 조회',
        '결제 플로우 미구현 — Alert 목업으로 대체',
      ]),
    ),
  },

  // ── 무신사스튜디오 ──────────────────────────────────────────────────────────

  {
    title: '무신사스튜디오 정책',
    slug: 'musinsa-studio',
    domain: 'facilities',
    features: ['musinsa'],
    content: doc(

      h2('유저는 무신사스튜디오 화면에서 갤러리 이미지와 기본 정보를 확인할 수 있다'),
      h3('UI'),
      bullets([
        '갤러리: 가로 스크롤, 이미지 width 300, height 200, gap 4 (contentContainerStyle)',
        '히어로 제목 "무신사스튜디오 동대문종합시장점": fontSize 20, Pretendard-Bold, color #1A1A1A',
        '부제목 "동대문종합상가 × 무신사 · A동·C동 4층": fontSize 14, Pretendard-Regular, color #888888',
        '공지 박스: margin 16, backgroundColor #FFF8F0, borderColor #FED7AA, borderRadius 12, padding 14',
        '공지 텍스트: color #92400E, fontSize 13, Pretendard-Regular, lineHeight 20',
        '전화/이메일 버튼: flex 1, backgroundColor #92400E, borderRadius 8, paddingVertical 10, alignItems center',
        '버튼 텍스트: fontSize 13, Pretendard-SemiBold, color #FFFFFF',
      ]),
      h3('UX'),
      bullets([
        '전화 버튼 탭 → Linking.openURL("tel:0269560170")',
        '이메일 버튼 탭 → Linking.openURL("mailto:musinsastudio@musinsa.com")',
      ]),
      h3('정책'),
      bullets([
        '무신사스튜디오는 무신사에서 직접 운영 — 예약·문의는 무신사스튜디오 공식 채널 이용',
        '연락처: 02-6956-0170 / musinsastudio@musinsa.com',
        '위치: A동·C동 4층',
      ]),

      h2('유저는 패션 특화 공간 카드를 탐색해 각 공간의 스펙과 용도를 파악할 수 있다'),
      h3('UI'),
      bullets([
        '공간 카드: width 47%, backgroundColor #F8F8F8, borderRadius 12, overflow hidden, borderWidth 1, borderColor #E5E5E5',
        '카드 이미지: width 100%, height 100, resizeMode cover',
        '카드 본문: padding 12, gap 2',
        '공간명: fontSize 15, Pretendard-Bold, color #1A1A1A, marginBottom 3',
        '스펙: fontSize 12, Pretendard-Regular, color #999999',
        '설명: fontSize 12, Pretendard-Regular, color #666666',
      ]),
      h3('UX'),
      bullets([
        '공간 카드는 탭 액션 없음 — 정보 표시 전용',
      ]),
      h3('정책'),
      table(
        ['공간명', '스펙', '용도'],
        [
          ['워크룸', '작업대 17개·검수대 2개', '디자인·패턴·실측 작업'],
          ['패킹존', '넓은 작업대 구비', '포장 전용 공간'],
          ['재봉실', '재봉틀·다리미 구비', '수선·가봉제 작업'],
          ['피팅룸', '전신 거울 비치', '착용감 확인'],
        ]
      ),

      h2('유저는 사무·공용 공간 카드를 탐색해 오피스 스펙을 파악할 수 있다'),
      h3('UI'),
      bullets([
        '공간 카드 스타일: 패션 특화 공간 카드와 동일',
        'grid2: flexDirection row, flexWrap wrap, gap 10',
      ]),
      h3('UX'),
      bullets([
        '공간 카드는 탭 액션 없음 — 정보 표시 전용',
      ]),
      h3('정책'),
      table(
        ['공간명', '스펙'],
        [
          ['프라이빗 오피스', '1~25인 규모'],
          ['회의실', '7개·최대 12인'],
          ['라운지', '공용 휴게 공간'],
          ['캔틴', '커피 무료 제공'],
        ]
      ),

      h2('유저는 제공 서비스 태그에서 무신사스튜디오가 지원하는 서비스 목록을 확인할 수 있다'),
      h3('UI'),
      bullets([
        '태그: backgroundColor #F8F8F8, borderRadius 20, paddingHorizontal 12, paddingVertical 7, borderWidth 1, borderColor #E5E5E5',
        '태그 텍스트: fontSize 13, Pretendard-Regular, color #1A1A1A',
        '태그 행: flexDirection row, flexWrap wrap, gap 8',
      ]),
      h3('UX'),
      bullets([
        '태그 탭 액션 없음 — 정보 표시 전용',
      ]),
      h3('정책'),
      bullets([
        '제공 서비스(8개): 복합기, 메일룸, 보안, 클리닝, 택배 지원, 컨설팅, 교육 프로그램, Wi-Fi',
      ]),
    ),
  },

  // ── 업무공간 ────────────────────────────────────────────────────────────────

  {
    title: '업무공간 정책',
    slug: 'workspace',
    domain: 'facilities',
    features: ['workspace'],
    content: doc(

      h2('유저는 업무공간 목록을 2열 카드 그리드로 보고 원하는 공간을 선택할 수 있다'),
      h3('UI'),
      bullets([
        '그리드: flexDirection row, flexWrap wrap, padding 16, gap 10',
        '카드: width 47%, backgroundColor #F8F8F8, borderRadius 14, padding 16, borderWidth 1, borderColor #E5E5E5',
        '이모지: fontSize 28, marginBottom 8',
        '공간명: fontSize 15, Pretendard-Bold, color #1A1A1A, letterSpacing -0.3',
        '설명 텍스트: fontSize 13, Pretendard-Regular, color #666666, marginTop 3',
        '위치 텍스트: fontSize 12, Pretendard-Regular, color #999999, marginTop 5',
      ]),
      h3('UX'),
      bullets([
        '카드 탭 → 해당 시설 상세 화면으로 이동',
        '헤더 뒤로가기 버튼 탭 → router.back()',
      ]),
      h3('정책'),
      table(
        ['공간명', '이모지', '설명', '위치', '라우트'],
        [
          ['셰어라운지', '🛋️', '공유 작업실·포토부스', '4층', '/facilities/sharelounge'],
          ['무신사스튜디오', '📸', '패션 크리에이터 촬영 공간', '4층', '/facilities/musinsa'],
          ['방송스튜디오', '🎬', '유튜브·콘텐츠 제작 스튜디오', '4층', '/facilities/broadcast'],
          ['사진스튜디오', '📷', '전문 사진 촬영 공간', '4층', '/facilities/photo-studio'],
          ['미팅룸 4인', '👥', '소규모 회의·미팅', '4층', '/facilities/meeting4'],
          ['미팅룸 6인', '🏢', '프레젠테이션·워크숍', '4층', '/facilities/meeting6'],
          ['디자이너라운지', '☕', '패션 크리에이터 전용 무료 공간', '4층', '/facilities/designer-lounge'],
        ]
      ),

      h2('유저는 각 업무공간의 위치와 특성을 카드에서 파악할 수 있다'),
      h3('UI'),
      bullets([
        '카드 내 이모지·공간명·설명·위치 정보가 수직으로 나열',
        '헤더: height 52, 제목 "업무공간" 중앙 표시, 뒤로가기 버튼 좌측',
      ]),
      h3('UX'),
      bullets([
        '전체 7개 공간 항상 표시 — 빈 상태 없음',
        '준비 중인 공간: 탭 시 해당 라우트로 이동 (라우트 화면 구현 여부는 각 시설마다 다름)',
      ]),
      h3('정책'),
      bullets([
        '업무공간 화면은 시설 목록 진입점 — 예약 흐름은 각 시설 상세 화면에서 처리',
        '7개 공간 모두 4층에 위치',
      ]),

      h2('유저는 업무공간 화면에서 검색·예약 흐름의 시작점을 명확히 인식할 수 있다'),
      h3('UI'),
      bullets([
        'ScrollView로 카드 그리드 감싸기 — 세로 스크롤 가능',
        '그리드 padding 16으로 여백 확보',
      ]),
      h3('UX'),
      bullets([
        '업무공간 화면 자체에 검색 기능 없음',
        '각 공간 카드 탭 → 해당 시설 예약/상세 화면으로 이동',
      ]),
      h3('정책'),
      bullets([
        '업무공간 화면 showsVerticalScrollIndicator false',
        '7개 공간 외 추가 공간 표시 시 그리드 자동 확장',
      ]),
    ),
  },
]

// ── Feature → domain slug 역매핑 ───────────────────────────────────────────

const DOMAIN_DEFS = [
  { name: '화면·UX 정책',     slug: 'screen-ux',   sort_order: 1, description: '지도, 검색, 홈 등 핵심 화면 UX 정책' },
  { name: '매장 정책',        slug: 'store',        sort_order: 2, description: '매장 상세 정보 및 표시 정책' },
  { name: '회원·마이페이지',   slug: 'membership',  sort_order: 3, description: '회원가입, 마이페이지 관련 정책' },
  { name: '시설 정책',        slug: 'facilities',   sort_order: 4, description: '셰어라운지, 무신사스튜디오, 업무공간 정책' },
]

const FEATURE_DEFS = [
  { name: '홈',         slug: 'home',         screen_path: '/' },
  { name: '지도',       slug: 'map',          screen_path: '/map' },
  { name: '매장 검색',  slug: 'search',       screen_path: '/search' },
  { name: '매장 상세',  slug: 'store-detail', screen_path: '/stores/:id' },
  { name: '마이페이지', slug: 'mypage',       screen_path: '/my' },
  { name: '셰어라운지', slug: 'sharelounge',  screen_path: '/facilities/sharelounge' },
  { name: '무신사스튜디오', slug: 'musinsa',  screen_path: '/facilities/musinsa' },
  { name: '업무공간',   slug: 'workspace',    screen_path: '/facilities/workspace' },
]

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. 유저 확인
  const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers()
  if (userErr) throw userErr
  const user = users.find(u => u.email === 'hiro85@naver.com')
  if (!user) throw new Error('hiro85@naver.com 유저를 찾을 수 없습니다.')
  console.log('✅ 유저 확인:', user.id)

  // 2. 프로젝트 조회 또는 생성
  let { data: project } = await supabase.from('projects').select('id').eq('name', '동대문종합시장').maybeSingle()
  if (!project) {
    const { data, error } = await supabase.from('projects').insert({ name: '동대문종합시장', created_by: user.id }).select('id').single()
    if (error) throw error
    project = data
    console.log('✅ 프로젝트 생성:', project.id)
  } else {
    console.log('✅ 기존 프로젝트 사용:', project.id)
  }
  const projectId = project.id

  // 3. 기존 데이터 삭제
  await supabase.from('policy_docs').delete().eq('project_id', projectId)
  await supabase.from('policy_domains').delete().eq('project_id', projectId)
  // name/slug unique constraint가 전역이므로 잔존 도메인도 제거
  await supabase.from('policy_domains').delete().in('slug', DOMAIN_DEFS.map(d => d.slug))
  await supabase.from('policy_domains').delete().in('name', DOMAIN_DEFS.map(d => d.name))
  await supabase.from('features').delete().eq('project_id', projectId)
  await supabase.from('features').delete().in('slug', FEATURE_DEFS.map(f => f.slug))
  await supabase.from('features').delete().in('name', FEATURE_DEFS.map(f => f.name))
  console.log('🗑️  기존 데이터 삭제 완료')

  // 4. 도메인 생성
  const { data: domains, error: domainErr } = await supabase
    .from('policy_domains')
    .upsert(DOMAIN_DEFS.map(d => ({ ...d, project_id: projectId })), { onConflict: 'name' })
    .select('id, slug')
  if (domainErr) throw domainErr
  const domainMap = Object.fromEntries(domains.map(d => [d.slug, d.id]))
  console.log('✅ 도메인 생성:', Object.keys(domainMap))

  // 5. 피처 생성
  const { data: features, error: featErr } = await supabase
    .from('features')
    .upsert(FEATURE_DEFS.map(f => ({ ...f, project_id: projectId })), { onConflict: 'slug' })
    .select('id, slug')
  if (featErr) throw featErr
  const featureMap = Object.fromEntries(features.map(f => [f.slug, f.id]))
  console.log('✅ 피처 생성:', Object.keys(featureMap))

  // 6. 정책 문서 + 섹션 + 피처 연결
  for (const policy of POLICIES) {
    const domainId = domainMap[policy.domain]
    if (!domainId) throw new Error(`도메인 없음: ${policy.domain}`)

    const contentText = extractText(policy.content)
    const { data: doc, error: docErr } = await supabase
      .from('policy_docs')
      .insert({
        title: policy.title,
        slug: policy.slug,
        domain_id: domainId,
        project_id: projectId,
        status: 'published',
        version: 1,
        created_by: user.id,
        content: policy.content,
        content_text: contentText,
        published_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (docErr) throw docErr

    // policy_sections (H2 기준)
    const h2Nodes = (policy.content as any).content.filter((n: any) => n.type === 'heading' && n.attrs?.level === 2)
    const sectionIds: string[] = []
    for (let i = 0; i < h2Nodes.length; i++) {
      const { data: sec, error: secErr } = await supabase
        .from('policy_sections')
        .insert({ policy_doc_id: doc.id, title: h2Nodes[i].content?.[0]?.text ?? '', sort_order: i, anchor_id: `section-${i + 1}` })
        .select('id')
        .single()
      if (secErr) throw secErr
      sectionIds.push(sec.id)
    }

    // feature_policies
    for (const slug of policy.features) {
      const featureId = featureMap[slug]
      if (!featureId) continue
      for (const sectionId of sectionIds) {
        await supabase.from('feature_policies').insert({ feature_id: featureId, section_id: sectionId })
      }
    }

    console.log(`✅ ${policy.title} — 섹션 ${sectionIds.length}개, 피처: ${policy.features.join(', ')}`)
  }

  console.log('\n🎉 완료! 정책', POLICIES.length, '개 생성됨')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
