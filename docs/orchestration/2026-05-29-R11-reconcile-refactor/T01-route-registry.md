# T01 — 라우트 레지스트리 전수 정합

## 0. 자기 정체성
너는 **R11 평면 4터미널 중 T01 일꾼**이다. 지휘자가 아니다. 본 작업만 자기완결로 수행하고 handover를 남긴다. 다른 터미널(T02 코드 정리·T03 리팩토링·T04 기획) 산출물은 건드리지 않는다.

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis (코인 차트 분석) — Next.js 16 App Router. v2.0 커뮤니티 피벗(코인판×네이버).
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T01 / 4** (R11-reconcile-refactor, Wave 1).
- 쓰기 영역(격리): **`docs/references/_WEB_CONTRACT.md` 단독**. 코드·다른 docs 절대 미수정.

## 2. 배경 — 핵심 사실 (지휘부 사전 검증)
- **라우트 레지스트리 괴리**: `_WEB_CONTRACT.md` §2 라우트 레지스트리는 **R-001~R-030(30행)**인데 `npm run build`는 **54 라우트** 생성. v2.0 커뮤니티 라우트가 정식 R-### 행으로 미등록.
- **미등록 의심 라우트**(빌드 출력 기준): `/board/[slug]`·`/board/[slug]/write`·`/board/[slug]/[postId]`·`/coin/[symbol]`·`/history`·`/feed.xml`·`/robots.txt`·`/sitemap.xml`·`/news` 등. **반드시 빌드 출력으로 전수 대조**.
- **§8 연결성 카운트 stale**: "등록 라우트 23개 / 활성 19개"(최종 2026-02-20) — 실제 빌드 54와 불일치.
- **`/blog`은 고아 아님**(지휘부 확인): `components/footer-section.tsx:35`이 "공식글"로 `/blog` 링크 + R-024 등록됨. 진입점 컬럼에 Footer 진입점 반영.
- R9-T03가 이미 GNB v2.0 실구조(primary 5/coinRoom 6/tools 8, /history 포함)·계약 v4까지 정합함 — 그 위에 **라우트 레지스트리 전수 정합**을 얹는 것.

## 3. 공통 SOT (읽기 전용)
- `CLAUDE.md` — 라우트 17개 표기·v2.0 피벗
- `docs/references/_WEB_CONTRACT.md` — 정합 대상 (현 상태 정독)
- 빌드 출력(아래 §7 명령으로 직접 생성) — 라우트 진실의 원천

## 4. 작업 목표

### Phase 1: 빌드 라우트 전수 추출
- `npm run build` 실행 → 출력의 라우트 목록(○/●/ƒ 표시 포함) 전수 수집. 이것이 **정합 기준**.
- `app/` 디렉토리 라우트 파일과 교차 확인(`page.tsx`·`route.ts`).

### Phase 2: 레지스트리 1:1 정합
- `_WEB_CONTRACT.md` §2 라우트 레지스트리에 **미등록 라우트를 R-### 행으로 추가**(기존 행 컬럼 구조 준수: ID·경로·설명·유형·파일·레이아웃·인증·진입점·연결·API·상태).
  - API 라우트(`/api/*`)를 레지스트리에 포함할지 여부는 기존 레지스트리 관례를 따른다(페이지 라우트 위주면 페이지만, §별도면 §로). 기존 패턴을 먼저 확인 후 일관되게.
- **진입점 정합**: `/blog`은 Footer 진입점 명시(고아 아님). GNB/Footer 실제 진입점을 `components/global-header.tsx`·`components/footer-section.tsx` 기준으로 대조(읽기만).
- **§5 FooterSection 레지스트리**를 `components/footer-section.tsx` 실코드의 링크와 대조해 정합(현재 "6페이지 공용" 표기 + 내부 링크 목록 검증).

### Phase 3: §8 연결성 카운트 갱신
- "등록 라우트 N개 / 활성 N개"를 실제 빌드 54 기준으로 갱신. 고아·미연결 라우트가 있으면 명시.
- 변경이력 표에 R11-T01 행 추가(날짜 2026-05-29, reconcile).

## 5. 도구 권장
- `npm run build` 출력 캡처 → 라우트 목록 SSOT. `app/` glob으로 page/route 파일 교차.
- `_WEB_CONTRACT.md` 기존 행 포맷을 그대로 따라 추가(컬럼 수·구분자 일치).

## 6. 의존성
- **독립** (Wave 1). 코드 미수정이라 T02·T03와 무충돌. T04(docs/design-brief)와도 디렉토리 분리.

## 7. 검증
```powershell
npm run build                          # green, 라우트 목록 캡처
# 빌드 라우트 수 ↔ 레지스트리 R-### 행 수 1:1 대조 (페이지 라우트 기준)
Select-String -Path docs/references/_WEB_CONTRACT.md -Pattern '^\| R-\d'   # 등록 행 카운트
```
- 빌드 페이지 라우트 ↔ 레지스트리 누락 0 / §8 카운트 실제 반영 / 변경이력 행 추가.

## 8. 완료 신호
`docs/handover/2026-05-29-R11-T01-route-registry.md` 작성. 포함 필수:
- 빌드 라우트 전수 목록(개수)
- 추가한 R-### 행 목록(미등록이었던 라우트)
- §8 카운트 변경(before→after)
- `/blog` 고아 아님 확정 근거(Footer 진입점)
- Footer 레지스트리 실코드 대조 결과

## 안티패턴
- ❌ 코드 파일 수정(읽기만) / `docs/references/` 외 docs 수정
- ❌ 빌드 출력 확인 없이 추측으로 라우트 등록(R3 stale-snapshot 재발)
- ❌ 기존 레지스트리 컬럼 구조 무시한 임의 포맷
- ❌ 한국어 handover 누락
