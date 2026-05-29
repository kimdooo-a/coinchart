# T03 — analysis/[symbol] 807줄 리팩토링

## 0. 자기 정체성
너는 **R11 평면 4터미널 중 T03 일꾼**이다. 지휘자가 아니다. 본 작업만 자기완결로 수행하고 handover를 남긴다. **동작·시각 보존이 최우선** — 리팩토링은 구조 개선이지 기능 변경이 아니다.

## 1. 컨텍스트
- 프로젝트: Crypto Chart Analysis — Next.js 16 App Router. v2.0 커뮤니티 피벗(AI 분석은 "도구" 메뉴로 격리, URL 유지).
- 작업 디렉토리: `F:\11_dev\260523 코인 차트분석`
- 본 터미널 역할: **T03 / 4** (R11-reconcile-refactor, Wave 1).
- 쓰기 영역(격리): **`app/analysis/[symbol]/`** (route-local 분해만). `components/` 공유 컴포넌트로 추출 **금지**(T02 영역).

## 2. 배경 — 핵심 사실
- **`app/analysis/[symbol]/page.tsx` = 807줄** — 프로젝트 최대 단일 파일. `docs/status/current.md` 미해결 사항·R10 handover "다음 작업 제안 #3"에 장기 플래그된 리팩토링 대상.
- 코인 심볼별 AI 차트 분석 상세 페이지. 라이브 기능이므로 **회귀 0**이 절대 조건.

## 3. 공통 SOT (읽기 전용)
- `CLAUDE.md` — 핵심 모듈(`lib/analysis.ts`·`lib/indicators.ts` 등)·기술 스택
- `app/analysis/[symbol]/page.tsx` — 리팩토링 대상(전체 정독 필수)
- `app/analysis/page.tsx`·`components/Analysis/*`·`components/Chart/*` — 페이지가 의존하는 컴포넌트(읽기만, 수정 금지)

## 4. 작업 목표

### Phase 1: 구조 분석
- `page.tsx` 807줄을 정독하여 **책임 단위**(데이터 페칭·상태 관리·지표 계산·렌더 섹션·핸들러)를 식별.
- 어떤 부분이 route-local로 분해 가능한지 매핑.

### Phase 2: route-local 분해 (동작 보존)
- 분해 대상을 **`app/analysis/[symbol]/` 하위 파일**로 추출:
  - 예: `app/analysis/[symbol]/_components/*.tsx`(섹션 컴포넌트), `app/analysis/[symbol]/_lib/*.ts`(헬퍼·훅), 타입 분리 등.
  - Next.js App Router 관례상 `_` 접두 폴더는 라우트로 취급되지 않음(co-location 안전).
- **`components/` 공유 컴포넌트로 빼지 않는다** — T02 영역 침범 + 본 라운드 격리 위반. route-local만.
- 로직·props·렌더 결과 **불변**. 순수 구조 재배치.

### Phase 3: 검증 (회귀 0 입증)
- tsc 0·build green·`/analysis/[symbol]` 라우트 정상 생성.
- 가능하면 분해 전후 렌더 동작 동일성 확인(개발 서버 또는 빌드 출력 라우트 동일).

## 5. 도구 권장
- 큰 파일이므로 섹션별로 Read 후 추출. 한 번에 한 책임 단위씩 옮기고 tsc로 즉시 검증(점진적 분해).

## 6. 의존성
- **독립** (Wave 1). 쓰기는 `app/analysis/[symbol]/` 하위만. T02(`components/`)와 파일 분리.
- ⚠️ `components/Analysis/*`·`components/Chart/*`를 **import해서 쓰는 것은 허용**(기존 의존 유지), 그 파일들을 **수정하는 것은 금지**(T02 영역).

## 7. 검증
```powershell
npx tsc --noEmit                       # 0
npm run build                          # green, /analysis/[symbol] 라우트 정상
# 분해 후 page.tsx 줄 수 감소 + 책임 분리 확인
```

## 8. 완료 신호
`docs/handover/2026-05-29-R11-T03-analysis-refactor.md` 작성. 포함 필수:
- 분해 전후 구조(page.tsx 807줄 → N줄 + 추출 파일 목록)
- 각 추출 파일의 책임
- 동작 보존 근거(tsc 0·build green·라우트 불변·로직 불변)
- `components/` 미수정 확인(격리 준수)

## 안티패턴
- ❌ `components/`로 컴포넌트 추출(T02 영역 침범·격리 위반)
- ❌ 기능·동작·시각 변경(리팩토링은 구조만)
- ❌ `docs/`·다른 라우트 수정
- ❌ 한 번에 대량 이동 후 미검증(점진적 tsc 검증 권장)
- ❌ 한국어 주석·handover 누락
