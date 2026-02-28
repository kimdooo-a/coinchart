# Blocking Patterns Reference

웹사이트 차단 패턴을 감지하기 위한 상세 참조 문서입니다.

---

## Cloudflare 차단

### 감지 키워드
- `cf-browser-verification`
- `cloudflare`
- `checking your browser`
- `ray id`
- `cf-chl-bypass`
- `cf-challenge`

### HTML 패턴
```html
<div id="cf-wrapper">
<span data-translate="checking_browser">
<div class="cf-browser-verification">
```

### JavaScript 감지 코드
```javascript
() => {
  const html = document.documentElement.innerHTML.toLowerCase();
  return html.includes('cloudflare') ||
         html.includes('cf-browser-verification') ||
         html.includes('checking your browser') ||
         html.includes('ray id');
}
```

### 대응
- Cloudflare 우회 불가
- 대체 사이트 검색 필요
- Memory MCP에 기록 후 Tavily 검색

---

## 로그인 필요

### 감지 키워드
- `login required`
- `sign in to continue`
- `please log in`
- `authentication required`
- `session expired`
- `로그인이 필요합니다`
- `로그인 후 이용`

### URL 패턴
- `/login`
- `/signin`
- `/auth`
- `/member/login`

### JavaScript 감지 코드
```javascript
() => {
  const html = document.documentElement.innerHTML.toLowerCase();
  return (html.includes('login') && html.includes('required')) ||
         html.includes('sign in to continue') ||
         html.includes('authentication required') ||
         html.includes('로그인이 필요');
}
```

### 대응
- API 키 또는 인증 토큰 필요
- 공개 데이터 소스 검색
- 사용자에게 인증 정보 요청

---

## CAPTCHA

### 감지 키워드
- `captcha`
- `recaptcha`
- `hcaptcha`
- `verify you are human`
- `i'm not a robot`
- `보안문자`

### Script 패턴
```html
<script src="https://www.google.com/recaptcha">
<script src="https://hcaptcha.com">
<div class="g-recaptcha">
<div class="h-captcha">
```

### JavaScript 감지 코드
```javascript
() => {
  const html = document.documentElement.innerHTML.toLowerCase();
  return html.includes('captcha') ||
         html.includes('recaptcha') ||
         html.includes('hcaptcha') ||
         html.includes('verify you are human');
}
```

### 대응
- 자동 우회 불가
- 대체 사이트 검색 필요
- API 제공 여부 확인

---

## 접근 거부 (403 Forbidden)

### 감지 키워드
- `access denied`
- `403 forbidden`
- `you don't have permission`
- `접근이 거부되었습니다`
- `권한이 없습니다`

### HTTP 상태 코드
- 403 Forbidden
- 401 Unauthorized

### JavaScript 감지 코드
```javascript
() => {
  const html = document.documentElement.innerHTML.toLowerCase();
  return html.includes('access denied') ||
         html.includes('403 forbidden') ||
         html.includes('permission denied');
}
```

### 대응
- IP 기반 차단 가능성
- 대체 사이트 검색
- VPN 또는 프록시 고려 (사용자 판단)

---

## Robots.txt 제한

### 확인 방법
```javascript
// robots.txt 직접 확인
fetch('/robots.txt')
  .then(r => r.text())
  .then(txt => {
    const lines = txt.split('\n');
    const disallowed = lines.filter(l => l.startsWith('Disallow:'));
    return disallowed;
  });
```

### 감지 패턴
- 페이지에 "blocked by robots" 메시지
- User-Agent 기반 차단

### 대응
- 해당 경로 크롤링 불가
- 허용된 경로 확인
- 대체 데이터 소스 검색

---

## IP 기반 차단

### 감지 키워드
- `your ip has been blocked`
- `rate limit exceeded`
- `too many requests`
- `429 too many requests`

### HTTP 상태 코드
- 429 Too Many Requests
- 503 Service Unavailable (일시적)

### 대응
- 요청 간격 조절 (Rate Limiting)
- 일정 시간 대기 후 재시도
- 대체 사이트 검색

---

## 지역 제한 (Geo-blocking)

### 감지 키워드
- `not available in your region`
- `지역 제한`
- `해외 접속 불가`

### 대응
- VPN 사용 (사용자 판단)
- 해당 지역 전용 데이터 소스 검색

---

## HTTP 상태 코드별 대응

| 코드 | 의미 | 대응 |
|------|------|------|
| 200 | 성공 | 데이터 구조 확인 진행 |
| 301/302 | 리다이렉트 | 최종 URL에서 재확인 |
| 400 | 잘못된 요청 | URL 형식 확인 |
| 401 | 인증 필요 | 로그인 필요로 분류 |
| 403 | 접근 거부 | 차단 원인 분석 후 기록 |
| 404 | 페이지 없음 | 대체 사이트 검색 |
| 429 | 요청 과다 | 대기 후 재시도 (1회) |
| 500+ | 서버 오류 | 대체 사이트 검색 |
| 503 | 서비스 불가 | 일시적 오류, 재시도 가능 |

---

## 차단 패턴 통합 감지 스크립트

```javascript
() => {
  const html = document.documentElement.innerHTML.toLowerCase();
  const title = document.title.toLowerCase();

  return {
    cloudflare: html.includes('cloudflare') ||
                html.includes('cf-browser-verification') ||
                html.includes('checking your browser'),

    loginRequired: (html.includes('login') && html.includes('required')) ||
                   html.includes('sign in to continue') ||
                   html.includes('로그인이 필요'),

    captcha: html.includes('captcha') ||
             html.includes('recaptcha') ||
             html.includes('hcaptcha'),

    accessDenied: html.includes('access denied') ||
                  html.includes('403 forbidden'),

    rateLimit: html.includes('too many requests') ||
               html.includes('rate limit'),

    geoBlocked: html.includes('not available in your region') ||
                html.includes('지역 제한'),

    robotsTxt: title.includes('robot') ||
               html.includes('blocked by robots')
  };
}
```
