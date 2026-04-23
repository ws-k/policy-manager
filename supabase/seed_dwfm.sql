-- DWFM 동대문종합시장 정책 시드 스크립트
-- Supabase SQL Editor에서 실행하세요.
-- 실행 전 주의: '동대문종합시장' 프로젝트의 기존 policy_docs/domains가 삭제됩니다.

DO $$
DECLARE
  v_user_id    UUID;
  v_project_id UUID;
  v_domain_id  UUID;
  v_doc1_id    UUID;
  v_doc2_id    UUID;
  v_doc3_id    UUID;
  v_doc4_id    UUID;
BEGIN

-- ── 1. 유저 확인 ─────────────────────────────────────────────────────────────
SELECT id INTO v_user_id FROM auth.users WHERE email = 'hiro85@naver.com';
IF v_user_id IS NULL THEN
  RAISE EXCEPTION 'hiro85@naver.com 유저를 찾을 수 없습니다.';
END IF;

-- ── 2. 프로젝트 조회 또는 생성 ────────────────────────────────────────────────
SELECT id INTO v_project_id FROM projects WHERE name = '동대문종합시장' LIMIT 1;
IF v_project_id IS NULL THEN
  INSERT INTO projects (name, created_by)
  VALUES ('동대문종합시장', v_user_id)
  RETURNING id INTO v_project_id;
END IF;

-- ── 3. 기존 데이터 삭제 (policy_docs → domains → features 순) ────────────────
DELETE FROM policy_docs    WHERE project_id = v_project_id;
DELETE FROM policy_domains WHERE project_id = v_project_id;
DELETE FROM features       WHERE project_id = v_project_id;

-- ── 4. 도메인 생성 ────────────────────────────────────────────────────────────
INSERT INTO policy_domains (name, slug, project_id, sort_order, description)
VALUES ('화면·UX 정책', 'screen-ux', v_project_id, 1, '지도, 검색, 필터 등 핵심 화면 UX 정책')
RETURNING id INTO v_domain_id;

-- ── 5. 피처 생성 ──────────────────────────────────────────────────────────────
INSERT INTO features (name, slug, project_id, screen_path) VALUES
  ('지도',     'map',    v_project_id, '/map'),
  ('매장 검색', 'search', v_project_id, '/search');

-- ── 6. 정책 문서 생성 ─────────────────────────────────────────────────────────

-- [1] 지도 검색 정책
v_doc1_id := uuid_generate_v4();
INSERT INTO policy_docs (id, title, slug, domain_id, project_id, status, version, created_by, content, content_text) VALUES (
  v_doc1_id,
  '지도 화면 검색 정책',
  'map-search',
  v_domain_id,
  v_project_id,
  'published',
  1,
  v_user_id,
  $json${
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "방문객은 지도 화면에서 매장명/카테고리/호수로 검색할 수 있다"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "검색창은 화면 상단 전체 너비(뒤로가기 버튼 영역 포함)를 차지한다"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "placeholder 텍스트는 좌측 56px 여백으로 고정한다 (backBtn 44px + gap 12px)"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "검색창 높이 48px / border-radius 22 / font-size 15px"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "검색 대상: 매장명, 카테고리, 세부 카테고리, 호수 코드"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "검색 결과는 최대 30개 매장으로 제한한다"}]}]}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "방문객은 검색 결과를 지도 위 하이라이트로 한눈에 확인할 수 있다"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "매칭 매장 전체를 지도에서 동시에 하이라이트한다 (단일 매장 핀 이동 방식 아님)"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "하이라이트 색상: fill rgba(255,180,0,0.35) / stroke #FFB400 / stroke-width 2"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "하이라이트되지 않은 매장: opacity 0.2로 dim 처리"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "결과 배지: \"{검색어} · N개\" 형태로 지도 상단에 표시"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "배지의 × 버튼을 누르면 하이라이트가 해제된다"}]}]}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "방문객은 진입점에 따라 검색 결과를 다른 형태로 볼 수 있다"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "검색 탭에서 진입: 결과를 2열 카드 목록으로 표시"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "지도 탭에서 진입: 결과를 지도 위 하이라이트로 표시"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "동일 검색어라도 진입점에 따라 결과 표현 형태가 달라진다"}]}]}
        ]
      }
    ]
  }$json$::jsonb,
  '방문객은 지도 화면에서 매장명/카테고리/호수로 검색할 수 있다 방문객은 검색 결과를 지도 위 하이라이트로 한눈에 확인할 수 있다 방문객은 진입점에 따라 검색 결과를 다른 형태로 볼 수 있다'
);

-- [2] 내위치 확인 정책
v_doc2_id := uuid_generate_v4();
INSERT INTO policy_docs (id, title, slug, domain_id, project_id, status, version, created_by, content, content_text) VALUES (
  v_doc2_id,
  '내위치 확인 정책',
  'my-location',
  v_domain_id,
  v_project_id,
  'published',
  1,
  v_user_id,
  $json${
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "방문객은 호수 입력으로 자신의 위치를 지도에서 확인할 수 있다"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "드럼 피커(동 / 층 / 호수)로 위치를 선택하여 해당 매장을 지도에서 표시한다"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "존재하지 않는 호수 입력 시 시스템 Alert 대신 인라인 오류 텍스트를 표시한다"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "오류 메시지: \"호수를 찾을 수 없습니다\" (빨간색, 입력 필드 바로 아래)"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "내위치 버튼 높이는 검색창과 동일하게 48px로 통일한다"}]}]}
        ]
      }
    ]
  }$json$::jsonb,
  '방문객은 호수 입력으로 자신의 위치를 지도에서 확인할 수 있다'
);

-- [3] 매장 필터 정책
v_doc3_id := uuid_generate_v4();
INSERT INTO policy_docs (id, title, slug, domain_id, project_id, status, version, created_by, content, content_text) VALUES (
  v_doc3_id,
  '매장 필터 정책',
  'store-filter',
  v_domain_id,
  v_project_id,
  'published',
  1,
  v_user_id,
  $json${
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "방문객은 카테고리/동/층으로 매장을 필터링할 수 있다"}]
      },
      {
        "type": "heading",
        "attrs": {"level": 3},
        "content": [{"type": "text", "text": "필터 UI 구조"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "탭 방식: 카테고리 탭 / 동·층 탭 2개로 구분"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "바텀시트 고정 높이: 360px (탭·대분류 전환 시 높이 변화 없음)"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "필터 적용 후 결과 매장을 지도에서 하이라이트로 표시한다"}]}]}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 3},
        "content": [{"type": "text", "text": "카테고리 탭"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "대분류: 직물 / 다이마루 / 레이스 / 피혁 / 실 / 단추 / 지퍼 / 부자재 (2줄 wrap)"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "기본 선택값: 직물"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "대분류는 항상 1개 이상 선택 상태 유지 (선택 해제 불가)"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "대분류 변경 시 세부 카테고리 목록이 전환되고 세부 선택이 초기화된다"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "세부 카테고리는 다중 선택 가능하다"}]}]}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 3},
        "content": [{"type": "text", "text": "동·층 탭"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "동: 전체 / A동 / B동 / C동 / 신관 — 다중 선택 가능"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "층: 전체 / B1 ~ 9층 — 다중 선택 가능"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "동을 선택하면 해당 동의 층 목록만 표시된다"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "전체 선택 시 해당 필드의 다중 선택이 모두 초기화된다"}]}]}
        ]
      }
    ]
  }$json$::jsonb,
  '방문객은 카테고리/동/층으로 매장을 필터링할 수 있다 카테고리 탭 동층 탭 대분류 세부 카테고리 다중 선택'
);

-- [4] 검색 화면 정책
v_doc4_id := uuid_generate_v4();
INSERT INTO policy_docs (id, title, slug, domain_id, project_id, status, version, created_by, content, content_text) VALUES (
  v_doc4_id,
  '검색 화면 정책',
  'search-screen',
  v_domain_id,
  v_project_id,
  'published',
  1,
  v_user_id,
  $json${
    "type": "doc",
    "content": [
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "방문객은 검색 탭에서 매장명/카테고리/호수로 매장을 검색할 수 있다"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "검색창 높이 48px / border-radius 22 / font-size 15px"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "검색 대상: 매장명, 카테고리, 세부 카테고리, 호수 코드"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "자동완성 제안: 최대 6개 표시"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "결과 표시: 2열 카드 목록 형태"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "동 필터 칩 제공: 전체 / A동 / B동 / C동 / 신관"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "결과 없음 시 \"검색 결과가 없습니다\" 표시"}]}]}
        ]
      },
      {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": "방문객은 검색 결과에서 지도 보기로 이동할 수 있다"}]
      },
      {
        "type": "bulletList",
        "content": [
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "결과가 1개 이상일 때 \"지도에서 보기\" FAB 버튼을 하단에 표시한다"}]}]},
          {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "FAB 위치: 하단 고정 (bottom 80px, 가운데 정렬)"}]}]}
        ]
      }
    ]
  }$json$::jsonb,
  '방문객은 검색 탭에서 매장명/카테고리/호수로 매장을 검색할 수 있다 방문객은 검색 결과에서 지도 보기로 이동할 수 있다'
);

RAISE NOTICE '완료 — project_id: %', v_project_id;

END $$;
