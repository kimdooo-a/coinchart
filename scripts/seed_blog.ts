import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// TipTap JSON 컨텐츠 생성 헬퍼
function tiptap(...nodes: object[]) {
  return { type: 'doc', content: nodes }
}
function heading(level: number, text: string) {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] }
}
function paragraph(text: string) {
  return { type: 'paragraph', content: [{ type: 'text', text }] }
}
function bold(text: string) {
  return { type: 'text', marks: [{ type: 'bold' }], text }
}
function paragraphWithMarks(...parts: object[]) {
  return { type: 'paragraph', content: parts }
}
function bulletList(...items: string[]) {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }],
    })),
  }
}
function blockquote(text: string) {
  return { type: 'blockquote', content: [paragraph(text)] }
}
function hr() {
  return { type: 'horizontalRule' }
}

async function main() {
  console.log('블로그 시드 데이터 생성 시작...\n')

  // 1. admin 유저 조회
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const admin = users?.find((u) => u.email === 'smartkdy7@gmail.com')
  if (!admin) {
    console.error('관리자 계정(smartkdy7@gmail.com)을 찾을 수 없습니다.')
    process.exit(1)
  }
  console.log(`관리자 확인: ${admin.email} (${admin.id})`)

  // 2. 카테고리 조회
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('*')
    .order('sort_order')
  console.log(`카테고리 ${categories?.length || 0}개 확인`)

  const catMap: Record<string, string> = {}
  for (const cat of categories || []) {
    catMap[cat.slug] = cat.id
  }

  // 3. 블로그 글 3개 작성
  const posts = [
    {
      author_id: admin.id,
      category_id: catMap['market-analysis'] || null,
      title: '2026년 3월 비트코인 시장 전망: AI가 분석한 핵심 시그널',
      slug: '2026-march-bitcoin-outlook-' + Date.now().toString(36),
      content: tiptap(
        heading(2, '비트코인, 2026년 봄을 맞이하다'),
        paragraph('2026년 3월, 비트코인은 중요한 기로에 서 있습니다. 지난 분기 동안의 가격 움직임과 온체인 데이터를 종합적으로 분석한 결과, 몇 가지 주목할만한 패턴이 발견되었습니다.'),
        heading(3, '핵심 기술적 지표 분석'),
        bulletList(
          'RSI(14): 중립 구간(45~55) 유지 — 과매수/과매도 아닌 관망세',
          'MACD: 시그널선 상향 교차 임박 — 단기 상승 모멘텀 형성 가능',
          '볼린저 밴드: 수축 단계 — 변동성 확대 직전 신호',
          'ADX: 20 이하 — 현재 뚜렷한 추세 없음 (Range 시장)'
        ),
        heading(3, '온체인 데이터가 말하는 것'),
        paragraph('장기 보유자(LTH)들의 축적이 꾸준히 이어지고 있습니다. 거래소 보유량은 지속적으로 감소하고 있어, 공급 압박이 서서히 형성되고 있습니다.'),
        blockquote('핵심 포인트: 현재 시장은 Range 상태이며, 볼린저 밴드 수축이 변동성 확대를 예고하고 있습니다. 방향성 확인 후 진입이 유리합니다.'),
        hr(),
        heading(3, '전략적 접근법'),
        paragraphWithMarks(
          bold('보수적 전략: '),
          { type: 'text', text: '현재 Range 시장에서는 지지선/저항선 기반 구간 매매가 유효합니다. 주요 지지선 근처에서 분할 매수, 저항선 근처에서 일부 익절하는 전략을 권장합니다.' }
        ),
        paragraphWithMarks(
          bold('공격적 전략: '),
          { type: 'text', text: '볼린저 밴드 브레이크아웃 시 추세 방향으로 포지션 진입. 단, 거래량 확인이 필수입니다.' }
        ),
        paragraph('ChartMaster의 AI 분석 엔진을 활용하면 실시간으로 시장 상태 변화를 감지하고, 최적의 진입/퇴장 시점을 파악할 수 있습니다.'),
        paragraph('다음 글에서는 이더리움과 알트코인 시장의 상관관계를 분석해보겠습니다.')
      ),
      excerpt: '2026년 3월 비트코인 시장의 기술적 지표와 온체인 데이터를 종합 분석합니다. RSI, MACD, 볼린저 밴드 등 핵심 시그널을 통해 시장 전망을 제시합니다.',
      status: 'published',
      language: 'ko',
      meta_title: '2026년 3월 비트코인 시장 전망 | ChartMaster',
      meta_description: 'AI 기반 비트코인 기술적 분석과 온체인 데이터로 본 2026년 3월 시장 전망',
      published_at: new Date().toISOString(),
      view_count: 0,
    },
    {
      author_id: admin.id,
      category_id: catMap['trading-strategy'] || null,
      title: '초보자를 위한 RSI 완벽 가이드: 과매수·과매도를 읽는 법',
      slug: 'rsi-guide-for-beginners-' + Date.now().toString(36),
      content: tiptap(
        heading(2, 'RSI란 무엇인가?'),
        paragraph('RSI(Relative Strength Index, 상대강도지수)는 가격의 상승 압력과 하락 압력의 상대적 비율을 0~100 사이의 숫자로 나타내는 기술적 지표입니다. 1978년 J. Welles Wilder가 개발했으며, 오늘날 가장 널리 사용되는 보조지표 중 하나입니다.'),
        heading(3, 'RSI 계산 방식'),
        paragraph('RSI = 100 - (100 / (1 + RS))'),
        paragraph('여기서 RS(Relative Strength)는 일정 기간 동안의 평균 상승폭을 평균 하락폭으로 나눈 값입니다. 일반적으로 14일 기간을 사용합니다.'),
        heading(3, 'RSI 핵심 해석법'),
        bulletList(
          '70 이상: 과매수 구간 — 가격이 과도하게 올라 조정 가능성',
          '30 이하: 과매도 구간 — 가격이 과도하게 내려 반등 가능성',
          '50 부근: 중립 — 방향성 미확정',
          '다이버전스: 가격은 신고가인데 RSI는 하락 → 추세 반전 경고'
        ),
        heading(3, '실전에서 RSI 활용하기'),
        paragraphWithMarks(
          { type: 'text', text: 'RSI는 단독으로 사용하기보다 ' },
          bold('다른 지표와 함께'),
          { type: 'text', text: ' 사용할 때 효과가 극대화됩니다. 예를 들어, RSI 과매도 + MACD 골든크로스가 동시에 발생하면 매수 신뢰도가 크게 높아집니다.' }
        ),
        blockquote('ChartMaster Tip: 코인 분석 페이지에서 RSI를 포함한 종합 분석을 실시간으로 확인할 수 있습니다. AI가 시장 상태에 맞는 최적의 지표 조합을 자동으로 제안합니다.'),
        heading(3, '흔한 실수와 주의점'),
        bulletList(
          '강한 추세에서 RSI 70/30만 보고 역추세 매매하지 말 것',
          '시간 프레임에 따라 RSI 값이 다르므로 여러 프레임 확인',
          'RSI 다이버전스는 "예고"일 뿐, 즉시 반전을 의미하지 않음'
        ),
        paragraph('다음 글에서는 MACD와 볼린저 밴드 활용법을 다루겠습니다.')
      ),
      excerpt: 'RSI(상대강도지수)의 개념부터 실전 활용법까지. 초보 투자자도 이해할 수 있는 RSI 완벽 가이드입니다.',
      status: 'published',
      language: 'ko',
      meta_title: 'RSI 완벽 가이드: 과매수·과매도 읽는 법 | ChartMaster',
      meta_description: 'RSI 상대강도지수의 개념, 계산법, 실전 활용 팁을 초보자 눈높이에서 설명합니다.',
      published_at: new Date(Date.now() - 86400000).toISOString(), // 어제
      view_count: 0,
    },
    {
      author_id: admin.id,
      category_id: catMap['crypto-news'] || null,
      title: 'Fear & Greed Index로 시장 심리 읽기: 공포에 사고, 탐욕에 파는 법',
      slug: 'fear-greed-index-guide-' + Date.now().toString(36),
      content: tiptap(
        heading(2, '공포탐욕지수(Fear & Greed Index)란?'),
        paragraph('워렌 버핏의 유명한 격언 "남들이 두려워할 때 탐욕을 부려라"를 수치화한 것이 바로 공포탐욕지수입니다. 0(극단적 공포)에서 100(극단적 탐욕) 사이의 값으로 시장 참여자들의 전반적인 심리 상태를 나타냅니다.'),
        heading(3, '구성 요소'),
        bulletList(
          '변동성 (25%): VIX 지수 등 시장 변동성',
          '시장 모멘텀/거래량 (25%): S&P 500 vs 125일 이동평균',
          '소셜 미디어 (15%): 트위터, 레딧 등의 감성 분석',
          '설문조사 (15%): 투자자 심리 조사',
          '비트코인 도미넌스 (10%): 알트코인 대비 BTC 점유율',
          '구글 트렌드 (10%): 암호화폐 관련 검색량'
        ),
        heading(3, '지수별 의미'),
        bulletList(
          '0~24: 극단적 공포 → 역발상 매수 기회 포착',
          '25~49: 공포 → 신중한 분할 매수 검토',
          '50~74: 탐욕 → 보유 유지, 추가 매수 자제',
          '75~100: 극단적 탐욕 → 일부 익절 및 리스크 관리'
        ),
        heading(3, 'ChartMaster에서 활용하기'),
        paragraph('ChartMaster의 시장 심리 페이지에서는 공포탐욕지수를 실시간으로 확인할 수 있습니다. AI 분석 엔진이 지수 변화 추이와 가격 움직임의 상관관계를 자동으로 분석하여, 역사적으로 유사한 구간에서의 수익률 데이터를 함께 제공합니다.'),
        blockquote('기억하세요: 공포탐욕지수는 "타이밍"의 참고 지표일 뿐, 투자 결정의 유일한 근거가 되어서는 안 됩니다. 기술적 분석, 펀더멘탈 분석과 함께 종합적으로 판단하세요.'),
        paragraph('다음 글에서는 김치 프리미엄과 시장 심리의 관계를 분석해보겠습니다.')
      ),
      excerpt: '공포탐욕지수의 구성 요소와 해석법, 그리고 실전 투자에서 시장 심리를 활용하는 전략을 소개합니다.',
      status: 'published',
      language: 'ko',
      meta_title: 'Fear & Greed Index 완벽 가이드 | ChartMaster',
      meta_description: '공포탐욕지수로 시장 심리를 읽고 투자에 활용하는 방법을 상세히 설명합니다.',
      published_at: new Date(Date.now() - 172800000).toISOString(), // 이틀 전
      view_count: 0,
    },
  ]

  // 태그 매핑
  const tagMap: Record<number, string[]> = {
    0: ['비트코인', 'BTC', '시장분석', '기술적분석', '2026'],
    1: ['RSI', '보조지표', '기술적분석', '초보자가이드', '트레이딩'],
    2: ['공포탐욕지수', '시장심리', '투자전략', '암호화폐'],
  }

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    console.log(`\n[${i + 1}/${posts.length}] 글 작성 중: ${post.title}`)

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(post)
      .select()
      .single()

    if (error) {
      console.error(`  ❌ 실패:`, error.message)
      continue
    }

    console.log(`  ✅ 생성됨: ${data.id} (${data.slug})`)

    // 태그 생성 및 연결
    const tags = tagMap[i] || []
    for (const tagName of tags) {
      const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣-]/g, '')
      const { data: tag } = await supabase
        .from('blog_tags')
        .upsert({ name: tagName, slug }, { onConflict: 'slug' })
        .select()
        .single()

      if (tag) {
        await supabase
          .from('blog_post_tags')
          .insert({ post_id: data.id, tag_id: tag.id })
        console.log(`    🏷️ 태그: ${tagName}`)
      }
    }
  }

  console.log('\n✅ 블로그 시드 완료!')
}

main().catch(console.error)
