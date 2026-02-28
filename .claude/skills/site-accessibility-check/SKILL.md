---
name: site-accessibility-check
description: Playwright MCP를 사용해 웹사이트 접근성과 데이터 존재 여부를 테스트하는 skill. 접근 불가 시 Memory MCP에 저장하고 Tavily로 대체 사이트 검색. 크롤링 전 사이트 검증, URL 접근성 확인 요청 시 사용.
---

# Site Accessibility Check Skill

웹사이트의 크롤링 가능 여부를 Playwright MCP로 테스트하고, 접근 불가 시 Memory MCP에 기록 후 대체 사이트를 자동으로 검색하는 전문 skill입니다.

---

## 사용 MCP 도구

### Playwright MCP

| 도구명 | 용도 |
|--------|------|
| `mcp__playwright__browser_navigate` | URL 탐색 및 HTTP 상태 확인 |
| `mcp__playwright__browser_snapshot` | 페이지 접근성 스냅샷 (DOM 구조 확인) |
| `mcp__playwright__browser_evaluate` | JavaScript 실행 (데이터 구조 분석) |
| `mcp__playwright__browser_take_screenshot` | 차단 화면 증거 캡처 |

### Memory MCP

| 도구명 | 용도 |
|--------|------|
| `create_entity` | 접근 불가 사이트 정보 저장 |
| `search_entities` | 저장된 차단 사이트 목록 조회 |

### Tavily MCP

| 도구명 | 용도 |
|--------|------|
| `mcp__tavily-remote__tavily_search` | 대체 사이트 검색 |

---

## 테스트 절차 (고정 순서)

### Step 1: 페이지 탐색 및 HTTP 상태 확인

```json
{
  "tool": "mcp__playwright__browser_navigate",
  "params": {
    "url": "<target_url>"
  }
}
```

**확인 사항**:
- HTTP 상태 코드 (200, 403, 404, 503 등)
- 리다이렉트 발생 여부
- 타임아웃 발생 여부

### Step 2: HTML 구조 및 데이터 존재 확인

```json
{
  "tool": "mcp__playwright__browser_evaluate",
  "params": {
    "function": "() => { const tables = document.querySelectorAll('table'); const rows = document.querySelectorAll('table tr, [role=\"row\"]'); const lists = document.querySelectorAll('ul, ol'); return { tableCount: tables.length, rowCount: rows.length, listCount: lists.length, hasData: rows.length > 0 || lists.length > 5 }; }"
  }
}
```

**확인 사항**:
- `<table>` 태그 존재 여부
- 데이터 행/레코드 개수
- 리스트 구조 존재 여부

### Step 3: 차단 패턴 감지

```json
{
  "tool": "mcp__playwright__browser_evaluate",
  "params": {
    "function": "() => { const html = document.documentElement.innerHTML.toLowerCase(); const title = document.title.toLowerCase(); return { cloudflare: html.includes('cloudflare') || html.includes('cf-browser-verification') || html.includes('checking your browser'), loginRequired: html.includes('login') && (html.includes('required') || html.includes('sign in')), captcha: html.includes('captcha') || html.includes('recaptcha') || html.includes('hcaptcha'), accessDenied: html.includes('access denied') || html.includes('403 forbidden'), robotsTxt: title.includes('robot') || html.includes('blocked by robots') }; }"
  }
}
```

**차단 패턴 목록**:
| 패턴 | 감지 키워드 |
|------|-------------|
| Cloudflare | `cloudflare`, `cf-browser-verification`, `checking your browser` |
| 로그인 필요 | `login required`, `sign in to continue` |
| CAPTCHA | `captcha`, `recaptcha`, `hcaptcha` |
| 접근 거부 | `access denied`, `403 forbidden` |
| Robots.txt | `blocked by robots`, `disallowed` |

### Step 4: 스크린샷 증거 수집 (차단 시)

```json
{
  "tool": "mcp__playwright__browser_take_screenshot",
  "params": {
    "filename": "blocked-site-evidence.png"
  }
}
```

---

## 결과 판정 로직

### 성공 조건 (모두 충족 시)

1. HTTP 상태 200
2. 데이터 구조 존재 (`<table>`, `<ul>`, JSON 등)
3. 차단 패턴 없음

### 실패 조건 (하나라도 해당 시)

1. HTTP 상태 4xx/5xx
2. 차단 패턴 감지
3. 타임아웃 (30초 초과)
4. 빈 페이지/데이터 없음

---

## 출력 형식

### 성공 시

```
✅ 크롤링 가능 확인
- URL: [검사한 URL]
- 페이지 타입: [정적 HTML / SPA / API 응답]
- 데이터 구조: [<table> 태그 (15개 행) / JSON API / <ul> 리스트]
- 권장 방법: [Requests + BeautifulSoup4 / Selenium / API 직접 호출]
- 추가 참고: [페이지네이션 있음 / 무한 스크롤 / 없음]
```

### 실패 시

```
❌ 접근 불가: [URL]
이유: [Cloudflare 차단 / 로그인 필요 / robots.txt 제한 / CAPTCHA 필요]
스크린샷: [blocked-site-evidence.png]

🔄 다른 사이트 찾는 중... (시도 1/3)
```

---

## 접근 불가 처리 워크플로우

### 1단계: Memory MCP에 기록

```json
{
  "tool": "create_entity",
  "params": {
    "name": "blocked_site_[domain]",
    "type": "blocked_crawl_target",
    "observations": [
      "url: [blocked_url]",
      "reason: [Cloudflare 차단]",
      "tested_at: [ISO timestamp]",
      "http_status: [403]"
    ]
  }
}
```

### 2단계: Tavily로 대체 사이트 검색

```json
{
  "tool": "mcp__tavily-remote__tavily_search",
  "params": {
    "query": "[원래 검색 키워드] site:go.kr OR site:or.kr",
    "search_depth": "advanced",
    "max_results": 5
  }
}
```

**검색어 변형 전략**:
- 1차: `[키워드] 공공데이터`
- 2차: `[키워드] API 제공`
- 3차: `[키워드] 오픈 데이터`

### 3단계: 재시도 (최대 3회)

```
시도 1: [URL_1] → ❌ Cloudflare 차단
시도 2: [URL_2] → ❌ 로그인 필요
시도 3: [URL_3] → ✅ 성공 또는 ❌ 실패
```

### 모든 시도 실패 시

```
⛔ 모든 대체 사이트 접근 실패

📋 차단된 사이트 목록:
1. [URL_1] - Cloudflare 차단 (2024-01-15T10:30:00Z)
2. [URL_2] - 로그인 필요 (2024-01-15T10:31:00Z)
3. [URL_3] - CAPTCHA 필요 (2024-01-15T10:32:00Z)

💡 권장 조치:
- 수동으로 공공데이터포털(data.go.kr) 검색
- API 키 발급 후 재시도
- 다른 데이터 소스 검토
```

---

## 페이지 타입별 권장 크롤링 방법

| 페이지 타입 | 감지 기준 | 권장 방법 |
|-------------|-----------|-----------|
| 정적 HTML | `<table>`, `<ul>` 직접 존재 | Requests + BeautifulSoup4 |
| SPA (React/Vue) | `<div id="root">`, `<script>` 다수 | Playwright / Selenium |
| API 응답 | Content-Type: application/json | Requests (직접 API 호출) |
| 동적 로딩 | 무한 스크롤, AJAX 호출 | Playwright + 대기 로직 |

---

## 금지 사항

1. **접근 가능 허위 판정 금지**
   - 차단 패턴이 감지되면 반드시 실패로 처리
   - 데이터가 실제로 존재하는지 확인 필수

2. **차단 이유 누락 금지**
   - 실패 시 반드시 구체적인 차단 이유 명시
   - "알 수 없는 오류"는 허용하지 않음

3. **무한 재시도 금지**
   - 최대 3회 시도 후 반드시 종료
   - 사용자에게 수동 조치 안내

4. **스크린샷 없는 차단 보고 금지**
   - 차단 판정 시 반드시 증거 스크린샷 첨부

---

## 관련 참조 문서

- [references/blocking-patterns.md](references/blocking-patterns.md) - 차단 패턴 상세 목록
- [references/mcp-tools.md](references/mcp-tools.md) - MCP 도구 파라미터 상세
- [references/decision-flowchart.md](references/decision-flowchart.md) - 결정 흐름도
- [assets/report-template.md](assets/report-template.md) - 리포트 템플릿
