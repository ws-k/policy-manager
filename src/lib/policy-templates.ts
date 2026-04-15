export interface PolicyTemplate {
  id: string
  name: string
  description: string
  content: Record<string, unknown>
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'blank',
    name: '빈 문서',
    description: '빈 상태로 시작합니다',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
  },
  {
    id: 'basic',
    name: '기본 구조',
    description: '제목과 섹션이 있는 기본 정책 구조',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '정책 제목' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '이 정책은 [서비스명]의 [목적]을 위해 제정되었습니다.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. 목적' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '본 정책의 목적을 입력하세요.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2. 적용 범위' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '본 정책이 적용되는 범위를 입력하세요.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '3. 세부 내용' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '세부 정책 내용을 입력하세요.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '4. 시행일' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '본 정책은 20XX년 XX월 XX일부터 시행합니다.' }] },
      ],
    },
  },
  {
    id: 'articles',
    name: '조항 형식',
    description: '제1조/제2조 형식의 법률형 정책',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '정책 제목' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '[시행 20XX. XX. XX.] [제정 20XX. XX. XX.]' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '제1조 (목적)' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '이 정책은 [목적]을 규정함을 목적으로 한다.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '제2조 (정의)' }] },
        {
          type: 'orderedList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '"용어1"이란 [정의]을 말한다.' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '"용어2"이란 [정의]을 말한다.' }] }] },
          ],
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '제3조 (적용 범위)' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '이 정책은 [적용 대상]에 적용한다.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '제4조 (시행일)' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '이 정책은 공포한 날부터 시행한다.' }] },
      ],
    },
  },
  {
    id: 'table',
    name: '표 중심',
    description: '표를 활용한 구조화된 정책',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '정책 제목' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '본 정책의 개요입니다.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. 기본 정보' }] },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '항목' }] }] },
                { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '내용' }] }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '시행일' }] }] },
                { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '20XX. XX. XX.' }] }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '적용 대상' }] }] },
                { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '[대상]' }] }] },
              ],
            },
          ],
        },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '2. 세부 규정' }] },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '구분' }] }] },
                { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '기준' }] }] },
                { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '비고' }] }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '항목 1' }] }] },
                { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '기준 내용' }] }] },
                { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '-' }] }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '항목 2' }] }] },
                { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '기준 내용' }] }] },
                { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '-' }] }] },
              ],
            },
          ],
        },
      ],
    },
  },
]
