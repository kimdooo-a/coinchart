# Accessibility Check Report Template

Site Accessibility Check의 출력 리포트 템플릿입니다.

---

## 성공 리포트

### 기본 형식

```
✅ 크롤링 가능 확인
- URL: {{url}}
- 페이지 타입: {{page_type}}
- 데이터 구조: {{data_structure}}
- 권장 방법: {{recommended_method}}
- 추가 참고: {{additional_notes}}
```

### 변수 설명

| 변수 | 가능한 값 | 설명 |
|------|-----------|------|
| `url` | URL 문자열 | 검사한 URL |
| `page_type` | 정적 HTML, SPA (React/Vue), API 응답, 동적 로딩 | 페이지 렌더링 방식 |
| `data_structure` | `<table>` 태그 (N개 행), JSON API, `<ul>` 리스트 (N개 항목) | 데이터 구조 |
| `recommended_method` | Requests + BeautifulSoup4, Playwright, Selenium, API 직접 호출 | 권장 크롤링 방법 |
| `additional_notes` | 페이지네이션 있음, 무한 스크롤, API 키 필요, 없음 | 추가 정보 |

### 예시

```
✅ 크롤링 가능 확인
- URL: https://data.go.kr/dataset/15012345
- 페이지 타입: 정적 HTML
- 데이터 구조: <table> 태그 (150개 행)
- 권장 방법: Requests + BeautifulSoup4
- 추가 참고: 페이지네이션 있음 (15페이지), CSV 다운로드 가능
```

---

## 실패 리포트

### 기본 형식

```
❌ 접근 불가: {{url}}
이유: {{blocking_reason}}
스크린샷: {{screenshot_path}}

🔄 다른 사이트 찾는 중... (시도 {{attempt}}/3)
```

### 변수 설명

| 변수 | 가능한 값 | 설명 |
|------|-----------|------|
| `url` | URL 문자열 | 접근 불가 URL |
| `blocking_reason` | Cloudflare 차단, 로그인 필요, robots.txt 제한, CAPTCHA 필요, 접근 거부, 타임아웃 | 차단 이유 |
| `screenshot_path` | 파일 경로 | 차단 화면 스크린샷 |
| `attempt` | 1, 2, 3 | 현재 시도 횟수 |

### 예시

```
❌ 접근 불가: https://coinmarketcap.com/api/v1/data
이유: Cloudflare 차단
스크린샷: blocked-coinmarketcap.png

🔄 다른 사이트 찾는 중... (시도 1/3)
```

---

## 최종 실패 리포트

### 기본 형식

```
⛔ 모든 대체 사이트 접근 실패

📋 차단된 사이트 목록:
{{#each blocked_sites}}
{{index}}. {{url}} - {{reason}} ({{tested_at}})
{{/each}}

💡 권장 조치:
- 수동으로 공공데이터포털(data.go.kr) 검색
- API 키 발급 후 재시도
- 다른 데이터 소스 검토
```

### 변수 설명

| 변수 | 타입 | 설명 |
|------|------|------|
| `blocked_sites` | 배열 | 차단된 사이트 목록 |
| `blocked_sites[].index` | 숫자 | 순번 |
| `blocked_sites[].url` | 문자열 | 차단된 URL |
| `blocked_sites[].reason` | 문자열 | 차단 이유 |
| `blocked_sites[].tested_at` | ISO 타임스탬프 | 테스트 시간 |

### 예시

```
⛔ 모든 대체 사이트 접근 실패

📋 차단된 사이트 목록:
1. https://coinmarketcap.com - Cloudflare 차단 (2024-12-29T10:30:00Z)
2. https://coingecko.com - 로그인 필요 (2024-12-29T10:31:00Z)
3. https://cryptowatch.com - CAPTCHA 필요 (2024-12-29T10:32:00Z)

💡 권장 조치:
- 수동으로 공공데이터포털(data.go.kr) 검색
- API 키 발급 후 재시도
- 다른 데이터 소스 검토
```

---

## 차단 이유별 상세 메시지

### Cloudflare 차단
```
❌ 접근 불가: {{url}}
이유: Cloudflare 차단
상세: Cloudflare의 봇 감지 시스템에 의해 차단됨
스크린샷: {{screenshot_path}}
```

### 로그인 필요
```
❌ 접근 불가: {{url}}
이유: 로그인 필요
상세: 이 데이터에 접근하려면 인증이 필요함
스크린샷: {{screenshot_path}}
```

### CAPTCHA 필요
```
❌ 접근 불가: {{url}}
이유: CAPTCHA 필요
상세: 자동화된 접근을 방지하기 위한 CAPTCHA 확인 필요
스크린샷: {{screenshot_path}}
```

### robots.txt 제한
```
❌ 접근 불가: {{url}}
이유: robots.txt 제한
상세: robots.txt에 의해 해당 경로 크롤링이 금지됨
스크린샷: {{screenshot_path}}
```

### 접근 거부 (403)
```
❌ 접근 불가: {{url}}
이유: 접근 거부 (HTTP 403)
상세: 서버가 요청을 거부함 (IP 차단 또는 권한 없음)
스크린샷: {{screenshot_path}}
```

### 타임아웃
```
❌ 접근 불가: {{url}}
이유: 타임아웃
상세: 서버 응답 시간이 30초를 초과함
스크린샷: 없음 (페이지 로드 실패)
```

---

## 페이지 타입별 권장 방법 메시지

### 정적 HTML
```
- 페이지 타입: 정적 HTML
- 권장 방법: Requests + BeautifulSoup4
- 이유: 서버 사이드 렌더링된 HTML로 직접 파싱 가능
```

### SPA (Single Page Application)
```
- 페이지 타입: SPA (React/Vue/Angular)
- 권장 방법: Playwright 또는 Selenium
- 이유: JavaScript 실행이 필요한 동적 콘텐츠
```

### API 응답
```
- 페이지 타입: API 응답 (JSON)
- 권장 방법: Requests (직접 API 호출)
- 이유: 구조화된 JSON 데이터로 직접 접근 가능
```

### 동적 로딩
```
- 페이지 타입: 동적 로딩 (무한 스크롤/AJAX)
- 권장 방법: Playwright + 스크롤/대기 로직
- 이유: 사용자 상호작용에 따라 데이터 로드
```

---

## Memory 저장 형식

### 차단 사이트 엔티티

```json
{
  "name": "blocked_site_{{domain_underscore}}",
  "type": "blocked_crawl_target",
  "observations": [
    "url: {{url}}",
    "reason: {{blocking_reason}}",
    "tested_at: {{iso_timestamp}}",
    "http_status: {{status_code}}",
    "screenshot: {{screenshot_path}}",
    "search_context: {{original_search_keyword}}"
  ]
}
```

### 예시

```json
{
  "name": "blocked_site_coinmarketcap_com",
  "type": "blocked_crawl_target",
  "observations": [
    "url: https://coinmarketcap.com/api/v1/cryptocurrency",
    "reason: Cloudflare 차단",
    "tested_at: 2024-12-29T10:30:00Z",
    "http_status: 403",
    "screenshot: blocked-coinmarketcap.png",
    "search_context: 암호화폐 시세 API"
  ]
}
```
