# 2026-06-13 — R9 10-터미널 작업 매트릭스 (gap-verify)

> 본 인덱스는 사용자가 **10개 Claude Code 터미널**을 띄워 각 `T0N-*.md` 프롬프트를 붙여넣어 병렬 실행하는 SOT입니다.

`created: 2026-06-13` · `conductor: 본 세션 (CEO)` · `라운드: R9` · `이전: R8 (session34)`

## 라운드 목적

R1~R8 마감(빌드 green) 이후 **"부족한 모든 내용"을 포괄 검증·보강**. 지휘자가 7개 차원 갭 스캔으로 도출한 10개 독립 작업을, 각 일꾼이 `--worker-parallel aggressive`로 **내부 kdyswarm 팬아웃**을 적극 사용해 최고 효율로 수행.

## 자기 정체성 (공통)

본 프로젝트는 별도 디스클레이머 정책이 없다. 대신 **글로벌 공통 의무**가 모든 터미널에 적용된다:
- 주석·커밋 메시지 **한국어**
- `.env`·`.env.local`·`nul` 커밋 금지
- **SSOT 규칙**: `lib/supabase/crypto.ts` ↔ `lib/supabase/stock.ts` 교차 import 금지 (ESLint `no-restricted-imports`)
- 코드 변경 시 관련 `docs/references/_*.md` 즉시 갱신 (단, **자기 천장 디렉토리 밖 레퍼런스는 T09에 위임**)

## 사용법

1. 10개 Claude Code 터미널을 본 프로젝트 디렉토리(`G:\11_dev\260601 코인 차트분석`)에서 띄움
2. 각 터미널에서 해당 `T0N-*.md`를 정독 → 그대로 실행 (또는 1줄 발사 프롬프트 붙여넣기)
3. SessionStart hook이 역할·타이틀 자동 주입 + `allowed_dirs` 격리 활성화
4. 완료 시 각자 `docs/handover/2026-06-13-R9-T0N-<name>.md` 작성
5. 지휘자(본 세션)가 회수·통합·검증 (Phase 4)

## 매트릭스

| T# | 작업 | 의존성 | Wave | 산출 디렉토리(천장) | 내부병렬 |
|----|------|--------|:---:|--------------------|:---:|
| T01 | 분석/확률/백테스트 엔진 단위 테스트 | 독립 | 1 | `__tests__/lib/` | ✅ mode 5/2 |
| T02 | 커뮤니티 쿼리 테스트 + 뉴스/검색 E2E | 독립 | 1 | `__tests__/lib/community/`, `e2e/` | ✅ mode 2 |
| T03 | 댓글 좋아요 RPC + 타입 센트럴라이제이션 | 독립 | 1 | `supabase/migrations/`, `types/`, `app/api/community/comment/` | auto |
| T04 | API 에러 핸들링 통일 | 독립 | 1 | `app/api/{news,stock,board}/`, `lib/community/fng.ts` | ✅ mode 2 |
| T05 | dead code 검증·정리 | 독립 | 1 | `lib/` (SSOT·fng 제외) | ✅ mode 2 |
| T06 | 페이지 Hero/blur gradient 토큰화 | 독립 | 1 | `app/{watchlist,settings,contact,terms,privacy,secure-memo,calendar,pricing}/` | ✅ mode 3 |
| T07 | Analysis/Stock 리팩토링+라이트화 | 독립 | 1 | `components/Analysis/`,`Stock/`,`hooks/`, `app/analysis/` | ✅ mode 3/5 |
| T08 | a11y 하드닝 + 회색 텍스트 대비 | 독립 | 1 | `components/{Blog,community,SecureMemo,ui}/` | ✅ mode 2 |
| T09 | 레퍼런스 정합 갱신 | T03·T04 lazy | 2 | `docs/references/_{API,COMPONENT_MAP,SCHEMA}_REFERENCE.md` | ✅ mode 2 |
| T10 | scripts `any` 타입 안전 | 독립 | 1 | `scripts/` | ✅ mode 3/5 |

## 발사 차수 (DAG)

```
Wave 1 (즉시, 9개 동시 가능): T01 T02 T03 T04 T05 T06 T07 T08 T10
Wave 2 (lazy):                T09 — T03 신규 RPC/route + T04 응답 변경을 반영
                              (현 코드 기준이면 Wave 1 동시 발사도 안전, 회수 시 재확인)
```

병렬 부담 시 권장 분할 발사: **1진(T01 T05 T06 T07 T08) → 2진(T02 T03 T04 T10) → T09**.

## 병렬 안전성

- 각 터미널은 자기 천장 디렉토리에만 쓰기 (PreToolUse `dispatch-write-guard` hook 강제, exit 2)
- 공통 SOT(`CLAUDE.md`·`docs/references/*`·`docs/rules/*`·`docs/SSOT_SEPARATION_RULES.md`)는 **읽기 전용** (T09만 references 쓰기)
- 디렉토리 충돌 검증: `_DISPATCH_CHECKPOINT.md` 충돌 분석 통과 (충돌 0 불변식)

## 안티패턴 (전 터미널 공통)

- ❌ 자기 천장 디렉토리 밖 쓰기 (특히 T07↔T08의 `components/` 경계, T06↔T07의 `app/` 경계)
- ❌ 공통 SOT 수정 (레퍼런스는 T09 전담, current.md는 cs 때 지휘자)
- ❌ SSOT 교차 import (`crypto.ts`↔`stock.ts`)
- ❌ 한국어 주석/커밋 누락, `.env`·`nul` 커밋
- ❌ 의미색(빨↑/파↓ 시세·노랑 프리미엄·주황 경고) 라이트화 중 훼손
- ❌ 실DB 직접 변경 (마이그 파일만 작성, 적용은 지휘자/사용자)
- ❌ handover 누락 / 내부 병렬 사용 내역 미기록

## 완료 시 인수인계 형식

`docs/handover/2026-06-13-R9-T0N-<short-name>.md` — 표준 handover. **내부 kdyswarm 사용 내역**(모드/subagent 수/산출/특이사항) 필수 포함.

## 관련

- 진입점: ../../../CLAUDE.md
- 체크포인트: ./_DISPATCH_CHECKPOINT.md
- 이전 라운드: ../../handover/2026-05-25-session34-r8-page-lightify.md
