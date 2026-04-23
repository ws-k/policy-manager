#!/usr/bin/env python3
"""
DWFM policy_docs 재작성 및 PATCH 스크립트
"""
import json
import requests

SUPABASE_URL = "https://vpmblzdxtducrbkdchur.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbWJsemR4dGR1Y3Jia2RjaHVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTYyMTA3MCwiZXhwIjoyMDkxMTk3MDcwfQ.l9krnGZLRHju2obROTdXP81Y358upnWZIqo-ts4gV5s"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

MD_OUTPUT_PATH = "/Users/woosoo/projects/policy-manager/docs/policy-spec.md"


def h2(text):
    return {
        "type": "heading",
        "attrs": {"level": 2},
        "content": [{"type": "text", "text": text}],
    }


def bullets(items):
    return {
        "type": "bulletList",
        "content": [
            {
                "type": "listItem",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": item}],
                    }
                ],
            }
            for item in items
        ],
    }


def fetch_all_docs():
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/policy_docs?select=*",
        headers={**HEADERS, "Prefer": ""},
    )
    resp.raise_for_status()
    return resp.json()


def extract_tables(doc_content):
    """원본 content에서 table 노드를 순서대로 추출"""
    tables = []
    nodes = doc_content.get("content", [])
    for node in nodes:
        if node.get("type") == "table":
            tables.append(node)
    return tables


def patch_doc(doc_id, new_content):
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/policy_docs?id=eq.{doc_id}",
        headers=HEADERS,
        json={"content": new_content},
    )
    return resp.status_code


def build_doc(nodes):
    return {"type": "doc", "content": nodes}


# ─────────────────────────────────────────────
# 각 문서별 content 빌더
# ─────────────────────────────────────────────

def build_search(tables):
    t = tables  # 사용 안 함 (table 없음)
    return build_doc([
        h2("유저는 검색 화면에 들어오면 키보드가 자동으로 열리고 매장명·카테고리·호수로 검색할 수 있습니다"),
        bullets([
            "검색 화면에 바로 진입하면 키보드가 자동으로 열립니다",
            "다른 화면에서 카테고리를 탭해 진입하면 해당 카테고리로 즉시 검색이 실행됩니다",
            "✕ 버튼을 탭하면 입력 내용과 필터가 모두 초기화되고 첫 화면으로 돌아갑니다",
            "키보드의 검색 버튼을 누르면 검색이 실행됩니다",
            "매장명, 카테고리, 세부 카테고리, 호수 코드를 기준으로 검색합니다",
        ]),
        h2("유저는 자동완성 제안 목록에서 원하는 검색어를 빠르게 선택할 수 있습니다"),
        bullets([
            "자동완성 항목을 탭하면 바로 검색이 실행되고 키보드가 닫힙니다",
            "최대 6개까지 제안 항목을 표시합니다",
            "인기 검색어(면직물, 폴리에스터, 레이스, 니트, 실크, 지퍼, 단추, 안감, 자수, 데님) 우선, 그 다음 매장명·카테고리 순으로 보여줍니다",
        ]),
        h2("유저는 검색 전 최근 검색어와 인기 검색어를 보고 탭해 빠르게 검색할 수 있습니다"),
        bullets([
            "최근 검색어나 인기 검색어를 탭하면 바로 검색이 실행됩니다",
            "최근 검색어는 현재 고정값으로 표시되며, 실제 기기 저장 연동은 추후 구현 예정입니다",
        ]),
        h2("유저는 검색 결과를 동 필터 칩으로 좁히고 2열 카드 목록으로 탐색할 수 있습니다"),
        bullets([
            "매장 카드를 탭하면 해당 매장의 상세 화면으로 이동합니다",
            "지도에서 보기 버튼을 탭하면 지도 화면으로 이동합니다",
            "동 필터 칩을 탭하면 해당 동의 매장만 즉시 필터링됩니다",
            "검색 결과가 없으면 화면 중앙에 \"검색 결과가 없습니다\" 문구가 표시됩니다",
            "지도에서 보기 버튼은 검색 결과가 1개 이상일 때만 표시됩니다",
            "동 필터는 하나만 선택할 수 있습니다",
        ]),
    ])


def build_my_location(tables):
    tbl = tables[0] if len(tables) > 0 else None
    nodes = [
        h2("유저는 동·층을 선택하고 호수를 입력해 자신의 위치를 지도 위 핀으로 표시할 수 있습니다"),
        bullets([
            "동을 변경하면 층 목록이 해당 동에 맞게 바뀌고 호수 입력이 초기화됩니다",
            "층을 변경하면 호수 입력이 초기화됩니다",
            "확인 버튼을 탭하면 입력한 호수로 위치를 찾아 지도에 핀을 표시합니다",
            "매장을 찾으면 핀이 지도에 표시되고 해당 층으로 자동 이동합니다",
            "호수를 찾을 수 없으면 입력 필드 아래에 오류 문구가 표시됩니다",
            "핀이 설정된 상태에서는 핀 제거 버튼이 함께 표시됩니다",
            "핀 제거를 탭하면 지도에서 핀이 삭제됩니다",
        ]),
        h2("유저는 동별 층 목록을 확인하고 올바른 호수를 입력할 수 있습니다"),
        bullets([
            "동은 A동, B동, C동, 신관(N동) 4개입니다",
            "동마다 사용 가능한 층이 다르며, 동 변경 시 층 목록이 자동으로 바뀝니다",
        ]),
    ]
    if tbl:
        nodes.append(tbl)
    nodes += [
        h2("유저는 설정된 핀 마커를 지도 위에서 시각적으로 확인하고 제거할 수 있습니다"),
        bullets([
            "핀이 설정되면 지도 화면이 자동으로 해당 위치로 이동합니다",
            "내 위치 버튼을 탭하면 내 위치 설정 창이 다시 열립니다",
            "핀 제거를 탭하면 핀이 삭제되고 버튼이 원래 상태로 돌아옵니다",
            "층당 핀은 1개만 설정 가능하며, 새로 설정하면 기존 핀이 교체됩니다",
        ]),
    ]
    return build_doc(nodes)


def build_mypage(tables):
    tbl = tables[0] if len(tables) > 0 else None
    nodes = [
        h2("유저는 마이페이지 헤더에서 화면 제목을 확인하고 이전 화면으로 돌아갈 수 있습니다"),
        bullets([
            "뒤로가기 버튼을 탭하면 이전 화면으로 이동합니다",
            "탭을 통해 직접 진입한 경우에는 홈 화면으로 이동합니다",
            "헤더 제목은 항상 \"마이페이지\"로 표시됩니다",
        ]),
        h2("유저는 계정 카드에서 자신의 계정 정보를 확인하고 수정 화면으로 이동할 수 있습니다"),
        bullets([
            "계정 수정 버튼을 탭하면 계정 수정 화면으로 이동합니다",
            "계정명과 이메일은 현재 임시 데이터로 표시되며, 서버 연동은 추후 구현 예정입니다",
        ]),
        h2("유저는 경력 불러오기 섹션에서 패션 경력을 인증하고 프로필에 추가할 수 있습니다"),
        bullets([
            "경력 불러오기 버튼을 탭하면 경력 인증 화면으로 이동합니다",
            "경력 인증 화면은 추후 구현 예정입니다",
        ]),
        h2("유저는 메뉴 목록에서 앱 내 주요 정보 화면에 접근할 수 있습니다"),
        bullets([
            "각 메뉴 항목을 탭하면 해당 화면으로 이동합니다",
        ]),
    ]
    if tbl:
        nodes.append(tbl)
    return build_doc(nodes)


def build_store_detail(tables):
    tbl = tables[0] if len(tables) > 0 else None
    nodes = [
        h2("유저는 매장 상세 화면의 히어로 영역에서 매장 코드와 이름을 한눈에 확인할 수 있습니다"),
        bullets([
            "뒤로가기 버튼을 탭하면 이전 화면으로 이동합니다",
            "존재하지 않는 매장에 접근하면 화면 중앙에 \"매장을 찾을 수 없습니다\" 문구가 표시됩니다",
        ]),
        h2("유저는 정보 행에서 취급품목·영업시간·위치·연락처를 체계적으로 확인할 수 있습니다"),
        bullets([
            "정보는 스크롤 가능한 목록으로 표시되며, 항목을 탭해도 별도 이동은 없습니다",
            "전화하기 버튼을 탭하면 해당 매장으로 전화 연결됩니다",
        ]),
    ]
    if tbl:
        nodes.append(tbl)
    nodes += [
        h2("유저는 지도 미리보기를 탭해 층별 평면도에서 매장 위치를 시각적으로 확인할 수 있습니다"),
        bullets([
            "지도 미리보기를 탭하면 지도 화면으로 이동합니다",
        ]),
        h2("유저는 한 번의 탭으로 매장에 전화를 걸 수 있습니다"),
        bullets([
            "전화하기 버튼을 탭하면 해당 번호로 바로 전화가 연결됩니다",
            "전화번호가 등록되지 않은 매장은 번호가 표시되지 않습니다",
        ]),
    ]
    return build_doc(nodes)


def build_musinsa(tables):
    tbl0 = tables[0] if len(tables) > 0 else None
    tbl1 = tables[1] if len(tables) > 1 else None
    nodes = [
        h2("유저는 무신사스튜디오 화면에서 갤러리 이미지와 기본 정보를 확인할 수 있습니다"),
        bullets([
            "전화 버튼을 탭하면 무신사스튜디오로 전화 연결됩니다 (02-6956-0170)",
            "이메일 버튼을 탭하면 이메일 앱이 열립니다 (musinsastudio@musinsa.com)",
            "무신사스튜디오는 무신사에서 직접 운영하며, 예약·문의는 공식 채널을 이용합니다",
            "위치: A동·C동 4층",
        ]),
        h2("유저는 패션 특화 공간 카드를 탐색해 각 공간의 스펙과 용도를 파악할 수 있습니다"),
        bullets([
            "공간 카드는 정보 확인 전용이며, 탭해도 별도 화면으로 이동하지 않습니다",
        ]),
    ]
    if tbl0:
        nodes.append(tbl0)
    nodes += [
        h2("유저는 사무·공용 공간 카드를 탐색해 오피스 스펙을 파악할 수 있습니다"),
        bullets([
            "공간 카드는 정보 확인 전용이며, 탭해도 별도 화면으로 이동하지 않습니다",
        ]),
    ]
    if tbl1:
        nodes.append(tbl1)
    nodes += [
        h2("유저는 제공 서비스 태그에서 무신사스튜디오가 지원하는 서비스 목록을 확인할 수 있습니다"),
        bullets([
            "서비스 태그는 정보 확인 전용입니다",
            "제공 서비스(8개): 복합기, 메일룸, 보안, 클리닝, 택배 지원, 컨설팅, 교육 프로그램, Wi-Fi",
        ]),
    ]
    return build_doc(nodes)


def build_share_lounge(tables):
    tbl = tables[0] if len(tables) > 0 else None
    nodes = [
        h2("유저는 셰어라운지 화면에서 갤러리 이미지를 가로 스크롤로 탐색하고 시설 기본 정보를 확인할 수 있습니다"),
        bullets([
            "갤러리 이미지는 좌우로 스크롤해서 볼 수 있으며, 탭해도 별도 화면은 열리지 않습니다",
            "뒤로가기 버튼을 탭하면 이전 화면으로 이동합니다",
            "위치: 4층 / 24시간 운영 / 사전 예약 필요",
            "이용 요금: 시간당 4,000원",
        ]),
        h2("유저는 시간 이용권에서 바로사용 또는 날짜지정을 선택해 이용 시간을 예약할 수 있습니다"),
        bullets([
            "바로사용을 선택하면 현재 시각 기준 다음 정시부터 이용 가능한 시간이 표시됩니다",
            "날짜지정을 선택하면 원하는 날짜와 시작 시간을 먼저 고른 후 이용 시간을 선택합니다",
            "이용 시간을 선택하면 패키지 선택이 초기화됩니다",
            "이용 방식을 변경하면 선택 내용이 모두 초기화됩니다",
            "날짜는 오늘 포함 7일 중 선택 가능하며, 시작 시간은 09:00~20:00 중 1시간 단위로 선택합니다",
            "이용 시간은 1~8시간 중 선택합니다",
        ]),
        h2("유저는 패키지를 구매해 더 저렴한 시간당 요금으로 셰어라운지를 이용할 수 있습니다"),
        bullets([
            "패키지를 탭하면 선택되며, 다시 탭하면 선택이 해제됩니다",
            "패키지를 선택하면 시간 이용권 선택 내용이 초기화됩니다",
        ]),
    ]
    if tbl:
        nodes.append(tbl)
    nodes += [
        h2("유저는 선택 완료 시 하단 패널에서 예상 시간 범위와 합계 금액을 확인하고 결제할 수 있습니다"),
        bullets([
            "결제하기 버튼을 탭하면 결제 금액 확인 팝업이 표시됩니다",
            "이용 시간권은 선택한 시간 × 4,000원, 패키지는 패키지 금액으로 계산됩니다",
            "실제 결제 기능은 추후 구현 예정입니다",
        ]),
    ]
    return build_doc(nodes)


def build_workspace(tables):
    tbl = tables[0] if len(tables) > 0 else None
    nodes = [
        h2("유저는 업무공간 목록을 2열 카드 그리드로 보고 원하는 공간을 선택할 수 있습니다"),
        bullets([
            "카드를 탭하면 해당 시설의 상세 화면으로 이동합니다",
            "뒤로가기 버튼을 탭하면 이전 화면으로 이동합니다",
        ]),
    ]
    if tbl:
        nodes.append(tbl)
    nodes += [
        h2("유저는 각 업무공간의 위치와 특성을 카드에서 파악할 수 있습니다"),
        bullets([
            "총 7개 공간이 항상 표시됩니다",
            "준비 중인 공간도 카드로 표시되며 탭하면 해당 화면으로 이동합니다",
            "모든 공간은 4층에 위치합니다",
        ]),
        h2("유저는 업무공간 화면에서 검색·예약 흐름의 시작점을 명확히 인식할 수 있습니다"),
        bullets([
            "업무공간 화면 자체에는 검색 기능이 없습니다",
            "각 공간 카드를 탭하면 해당 시설의 예약·상세 화면으로 이동합니다",
        ]),
    ]
    return build_doc(nodes)


def build_map_search(tables):
    return build_doc([
        h2("유저는 지도 상단 검색 바를 탭해 전체 화면 검색을 열 수 있습니다"),
        bullets([
            "검색 바를 탭하면 전체 화면 검색창이 열리고 키보드가 자동으로 열립니다",
            "내 위치 버튼을 탭하면 내 위치 설정 창이 열립니다",
            "뒤로가기 버튼을 탭하면 이전 화면으로 이동합니다",
            "지도 배경을 탭하면 검색 바 등 상단 UI가 숨겨지며, 다시 탭하면 나타납니다",
        ]),
        h2("유저는 지도 검색창에서 매장명·카테고리·호수로 검색하고 결과를 지도에 하이라이트할 수 있습니다"),
        bullets([
            "검색창이 열리면 자동으로 입력 포커스가 맞춰집니다",
            "개별 매장을 탭하면 해당 매장만 지도에서 강조 표시되고 검색창이 닫힙니다",
            "지도에서 보기 버튼을 탭하면 전체 결과가 지도에서 강조 표시됩니다",
            "키보드 검색 버튼을 누르면 전체 결과가 지도에서 강조 표시됩니다",
            "× 버튼을 탭하면 검색어가 초기화됩니다",
            "검색 결과는 최대 30개까지 표시됩니다",
            "결과가 없으면 \"검색 결과가 없습니다\" 문구가 표시됩니다",
        ]),
        h2("유저는 검색 결과를 지도 위 하이라이트와 배지로 한눈에 파악할 수 있습니다"),
        bullets([
            "검색이 적용되면 지도 상단에 배지가 표시되고 해당 매장이 강조됩니다",
            "배지의 × 버튼을 탭하면 강조 표시가 해제됩니다",
        ]),
        h2("유저는 필터 바텀시트로 카테고리와 동·층을 복합 필터링해 지도에서 결과를 볼 수 있습니다"),
        bullets([
            "대분류를 탭하면 해당 카테고리의 세부 항목으로 목록이 바뀝니다",
            "세부 카테고리는 여러 개를 동시에 선택할 수 있습니다",
            "동을 선택하면 해당 동의 층 목록이 표시됩니다",
            "전체를 탭하면 해당 필터의 모든 선택이 초기화됩니다",
            "지도에서 보기 버튼을 탭하면 필터가 적용되고 결과가 지도에 강조 표시됩니다",
            "초기화를 탭하면 모든 필터 설정이 초기화됩니다",
            "대분류는 최소 1개 이상 선택되어야 합니다",
        ]),
    ])


def build_map_nav(tables):
    tbl = tables[0] if len(tables) > 0 else None
    nodes = [
        h2("유저는 지도를 핀치줌과 드래그로 자유롭게 탐색하고 지도 배경 탭으로 UI를 숨길 수 있습니다"),
        bullets([
            "두 손가락을 모으거나 펼쳐서 지도를 확대·축소할 수 있습니다",
            "한 손가락으로 드래그해서 지도를 이동할 수 있습니다",
            "지도 배경을 탭하면 상단 버튼 등 UI가 숨겨지며, 다시 탭하면 나타납니다",
            "매장 셀을 탭하면 하단에 매장 정보 카드가 올라옵니다",
        ]),
        h2("유저는 건물 칩을 탭해 특정 동의 매장만 강조해서 볼 수 있습니다"),
        bullets([
            "전체를 탭하면 모든 동의 매장이 동일하게 표시됩니다",
            "특정 동을 탭하면 해당 동으로 지도가 자동으로 이동합니다",
            "필터 아이콘을 탭하면 카테고리·동·층 필터 창이 열립니다",
        ]),
    ]
    if tbl:
        nodes.append(tbl)
    nodes += [
        h2("유저는 층 선택기로 현재 보고 있는 층을 빠르게 전환할 수 있습니다"),
        bullets([
            "층을 탭하면 해당 층의 지도로 전환됩니다",
            "층 목록은 9층부터 B1층까지 총 10개입니다",
        ]),
        h2("유저는 매장 셀을 탭해 하단 카드로 기본 정보를 확인하고 상세 화면으로 이동할 수 있습니다"),
        bullets([
            "매장 셀을 탭하면 하단에 매장 정보 카드가 표시됩니다",
            "카드를 탭하면 해당 매장의 상세 화면으로 이동합니다",
            "✕ 버튼을 탭하면 카드가 닫힙니다",
            "지도 배경을 탭하면 카드가 닫히면서 UI도 함께 숨겨집니다",
            "매장 데이터가 없는 공간(입점 대기 중)은 탭해도 상세 화면으로 이동하지 않습니다",
        ]),
        h2("유저는 편의시설 버튼을 탭해 층별 편의시설 위치 정보를 확인할 수 있습니다"),
        bullets([
            "편의시설 버튼을 탭하면 편의시설 목록 창이 열립니다",
            "항목을 탭하면 해당 시설이 선택 또는 해제됩니다",
            "편의시설 창이 열려도 지도를 계속 탐색할 수 있습니다",
            "편의시설 항목: 화장실, ATM, 엘리베이터, 에스컬레이터, 흡연실, 계단",
        ]),
    ]
    return build_doc(nodes)


def build_home(tables):
    tbl0 = tables[0] if len(tables) > 0 else None
    tbl1 = tables[1] if len(tables) > 1 else None
    nodes = [
        h2("유저는 히어로 영역에서 앱 정체성을 인식하고 검색·지도·마이페이지에 빠르게 접근할 수 있습니다"),
        bullets([
            "검색 바를 탭하면 검색 화면으로 이동합니다 (검색 바에 직접 글자를 입력할 수 없습니다)",
            "지도 버튼을 탭하면 지도 화면으로 이동합니다",
            "마이페이지 아이콘을 탭하면 마이페이지로 이동합니다",
            "히어로 영역은 항상 어두운 배경으로 표시됩니다",
        ]),
        h2("유저는 카테고리 그리드에서 원하는 카테고리를 탭해 해당 검색 결과로 이동할 수 있습니다"),
        bullets([
            "카테고리를 탭하면 해당 카테고리의 검색 결과 화면으로 바로 이동합니다",
        ]),
    ]
    if tbl0:
        nodes.append(tbl0)
    nodes += [
        h2("유저는 프로모 배너에서 현재 진행 중인 전시·이벤트 정보를 확인할 수 있습니다"),
        bullets([
            "배너는 하나의 고정 이미지로 표시되며 자동으로 넘어가지 않습니다",
            "배너 탭 기능은 추후 구현 예정입니다",
            "배너 콘텐츠는 현재 고정값으로 표시되며, 서버 연동은 추후 구현 예정입니다",
        ]),
        h2("유저는 편의시설 카드를 탭해 각 시설 상세 화면으로 빠르게 이동할 수 있습니다"),
        bullets([
            "셰어라운지 카드를 탭하면 셰어라운지 화면으로 이동합니다",
            "무신사스튜디오 카드를 탭하면 무신사스튜디오 화면으로 이동합니다",
            "업무공간 카드를 탭하면 업무공간 목록 화면으로 이동합니다",
            "현재 구현되지 않은 시설을 탭하면 \"서비스를 준비 중입니다\" 안내가 표시됩니다",
        ]),
    ]
    if tbl1:
        nodes.append(tbl1)
    return build_doc(nodes)


# ─────────────────────────────────────────────
# 마크다운 변환 헬퍼
# ─────────────────────────────────────────────

def content_to_markdown(content_nodes):
    lines = []
    for node in content_nodes:
        ntype = node.get("type")
        if ntype == "heading":
            level = node.get("attrs", {}).get("level", 2)
            text = "".join(c.get("text", "") for c in node.get("content", []))
            lines.append(f"{'#' * (level + 1)} {text}")
        elif ntype == "bulletList":
            for item in node.get("content", []):
                for para in item.get("content", []):
                    text = "".join(c.get("text", "") for c in para.get("content", []))
                    lines.append(f"- {text}")
        elif ntype == "table":
            lines.append("*(표 데이터 - 원본 테이블 유지)*")
        lines.append("")
    return "\n".join(lines)


# ─────────────────────────────────────────────
# 문서 매핑
# ─────────────────────────────────────────────

DOC_MAP = {
    "8e3a8bd2-618c-46b5-a6ab-2286640aea7a": ("검색 화면 정책", build_search),
    "5223c382-a7d4-4759-8c49-63497cbb67f0": ("내위치 확인 정책", build_my_location),
    "3aaf4d6f-b34f-4fdb-9ad8-f4c03a310f02": ("마이페이지 정책", build_mypage),
    "a990de24-76f5-441d-8c5e-e5c26dec3a23": ("매장 상세 정책", build_store_detail),
    "f628e263-207f-4a07-9a52-e19da31856f2": ("무신사스튜디오 정책", build_musinsa),
    "48ea186f-4de5-403a-a5e6-7ee4e46924f1": ("셰어라운지 정책", build_share_lounge),
    "47525518-f62c-4aef-bbee-9a67f1b40f27": ("업무공간 정책", build_workspace),
    "7891b994-1579-4deb-9874-3ee74d6b4494": ("업무공간 정책 (복사본)", build_workspace),
    "badf4a56-f594-42b8-a945-d35e7024fa03": ("지도 화면 검색 정책", build_map_search),
    "8783fc10-8f9c-4997-8c88-6d7d73027ca2": ("지도 화면 탐색 정책", build_map_nav),
    "dc7b125d-3ac5-4b96-8086-9d3e5f9afabb": ("홈 화면 정책", build_home),
}


def main():
    print("Fetching all policy_docs...")
    docs = fetch_all_docs()
    print(f"  -> {len(docs)}개 문서 수신\n")

    # id -> doc 매핑
    doc_by_id = {d["id"]: d for d in docs}

    md_sections = []
    md_sections.append("# DWFM 서비스 정책 명세서\n")
    md_sections.append("> 이 문서는 DWFM 앱의 화면별 정책을 정의합니다. 비개발자도 읽을 수 있도록 작성했습니다.\n")

    for doc_id, (title, builder) in DOC_MAP.items():
        doc = doc_by_id.get(doc_id)
        if not doc:
            print(f"[SKIP] {doc_id} — 문서 없음")
            continue

        # 원본 table 노드 추출
        original_content = doc.get("content", {})
        if isinstance(original_content, str):
            original_content = json.loads(original_content)
        tables = extract_tables(original_content)

        # 새 content 빌드
        new_content = builder(tables)

        # PATCH
        status = patch_doc(doc_id, new_content)
        print(f"[{status}] {title} ({doc_id})")

        # MD 추가
        md_sections.append(f"## {title}\n")
        md_body = content_to_markdown(new_content.get("content", []))
        md_sections.append(md_body)
        md_sections.append("\n---\n")

    # MD 파일 저장
    md_content = "\n".join(md_sections)
    with open(MD_OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"\nMD 파일 저장 완료: {MD_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
