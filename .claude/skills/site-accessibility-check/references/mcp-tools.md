# MCP Tools Parameter Reference

Site Accessibility Check에서 사용하는 MCP 도구들의 파라미터 상세 참조입니다.

---

## Playwright MCP

### browser_navigate

URL로 이동합니다.

```json
{
  "tool": "mcp__playwright__browser_navigate",
  "params": {
    "url": "https://example.com"
  }
}
```

**파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| url | string | O | 이동할 URL |

**반환값**: 페이지 로드 상태, 최종 URL

---

### browser_snapshot

페이지의 접근성 스냅샷을 캡처합니다.

```json
{
  "tool": "mcp__playwright__browser_snapshot",
  "params": {}
}
```

**파라미터**: 없음

**반환값**:
- 접근성 트리 (accessibility tree)
- 페이지 구조
- 요소 참조 (ref)
- 텍스트 내용

---

### browser_evaluate

페이지에서 JavaScript를 실행합니다.

```json
{
  "tool": "mcp__playwright__browser_evaluate",
  "params": {
    "function": "() => { return document.title; }"
  }
}
```

**파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| function | string | O | 실행할 JavaScript 함수 (문자열) |
| element | string | X | 요소 설명 (ref와 함께 사용) |
| ref | string | X | 대상 요소 참조 |

**주의사항**:
- 함수는 문자열로 전달
- 동기 함수 권장
- DOM 접근 가능
- 화살표 함수 형태: `() => { ... }`

**데이터 구조 확인 예시**:
```javascript
"() => {
  const tables = document.querySelectorAll('table');
  const rows = document.querySelectorAll('table tr');
  return {
    tableCount: tables.length,
    rowCount: rows.length
  };
}"
```

**차단 패턴 감지 예시**:
```javascript
"() => {
  const html = document.documentElement.innerHTML.toLowerCase();
  return {
    cloudflare: html.includes('cloudflare'),
    captcha: html.includes('captcha')
  };
}"
```

---

### browser_take_screenshot

페이지 스크린샷을 캡처합니다.

```json
{
  "tool": "mcp__playwright__browser_take_screenshot",
  "params": {
    "filename": "screenshot.png",
    "fullPage": false
  }
}
```

**파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| filename | string | X | 저장할 파일명 (기본: page-{timestamp}.png) |
| fullPage | boolean | X | 전체 페이지 캡처 여부 |
| type | string | X | 이미지 형식 ("png" 또는 "jpeg") |
| element | string | X | 특정 요소만 캡처 (ref와 함께) |
| ref | string | X | 대상 요소 참조 |

---

### browser_click

요소를 클릭합니다.

```json
{
  "tool": "mcp__playwright__browser_click",
  "params": {
    "element": "Submit button",
    "ref": "button[type=submit]"
  }
}
```

**파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| element | string | O | 요소 설명 |
| ref | string | O | 요소 참조 |
| button | string | X | 마우스 버튼 (left/right/middle) |
| doubleClick | boolean | X | 더블클릭 여부 |

---

### browser_wait_for

특정 조건을 기다립니다.

```json
{
  "tool": "mcp__playwright__browser_wait_for",
  "params": {
    "text": "Loading complete",
    "time": 5
  }
}
```

**파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| text | string | X | 나타날 텍스트 |
| textGone | string | X | 사라질 텍스트 |
| time | number | X | 대기 시간 (초) |

---

## Memory MCP

### create_entity

엔티티를 생성하고 정보를 저장합니다.

```json
{
  "tool": "create_entity",
  "params": {
    "name": "blocked_site_example_com",
    "type": "blocked_crawl_target",
    "observations": [
      "url: https://example.com",
      "reason: Cloudflare 차단",
      "tested_at: 2024-01-15T10:30:00Z",
      "http_status: 403"
    ]
  }
}
```

**파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| name | string | O | 엔티티 이름 (고유) |
| type | string | O | 엔티티 타입 |
| observations | array | O | 관찰 내용 목록 |

**차단 사이트 기록 예시**:
```json
{
  "name": "blocked_site_coinmarketcap_com",
  "type": "blocked_crawl_target",
  "observations": [
    "url: https://coinmarketcap.com/api/v1/data",
    "reason: Cloudflare 차단",
    "tested_at: 2024-12-29T10:30:00Z",
    "http_status: 403",
    "screenshot: blocked-coinmarketcap.png"
  ]
}
```

---

### search_entities

저장된 엔티티를 검색합니다.

```json
{
  "tool": "search_entities",
  "params": {
    "query": "blocked_crawl_target"
  }
}
```

**파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| query | string | O | 검색 쿼리 |

**반환값**: 일치하는 엔티티 목록

---

## Tavily MCP

### tavily_search

웹 검색을 수행합니다.

```json
{
  "tool": "mcp__tavily-remote__tavily_search",
  "params": {
    "query": "암호화폐 시세 API 공공데이터",
    "search_depth": "advanced",
    "max_results": 5
  }
}
```

**파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| query | string | O | 검색 쿼리 |
| search_depth | string | X | 검색 깊이 (basic/advanced) |
| max_results | number | X | 최대 결과 수 (기본: 5) |
| include_domains | array | X | 포함할 도메인 |
| exclude_domains | array | X | 제외할 도메인 |
| topic | string | X | 주제 (general/news/finance) |

**대체 사이트 검색 예시**:
```json
{
  "query": "코인 시세 데이터 API site:go.kr OR site:or.kr",
  "search_depth": "advanced",
  "max_results": 5,
  "include_domains": ["go.kr", "or.kr", "github.com"]
}
```

**반환값**:
```json
[
  {
    "url": "https://data.go.kr/...",
    "title": "공공데이터 포털 - 암호화폐 시세",
    "content": "..."
  }
]
```

---

### tavily_extract

URL에서 콘텐츠를 추출합니다.

```json
{
  "tool": "mcp__tavily-remote__tavily_extract",
  "params": {
    "urls": ["https://example.com/data"]
  }
}
```

**파라미터**:
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| urls | array | O | 추출할 URL 목록 |
| extract_depth | string | X | 추출 깊이 (basic/advanced) |
| format | string | X | 형식 (markdown/text) |

---

## 도구 사용 순서

Site Accessibility Check의 권장 도구 사용 순서:

```
1. browser_navigate(url)
   ↓
2. browser_evaluate() - 데이터 구조 확인
   ↓
3. browser_evaluate() - 차단 패턴 감지
   ↓
4. [차단 시] browser_take_screenshot()
   ↓
5. [차단 시] create_entity() - Memory에 기록
   ↓
6. [차단 시] tavily_search() - 대체 사이트 검색
   ↓
7. 1번으로 돌아가기 (최대 3회)
```
