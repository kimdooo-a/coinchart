# R1 — 메인페이지 풀데이터 + 인프라 미들웨어 + 라이트화

> 라운드: R1
> 시작일: 2026-05-23
> 태그: mainpage
> 터미널 수: 15
> 발사 차수: 4단계
> 지휘자: CEO (1개 본 세션)

---

## 0. 라운드 목표

메인페이지(`app/page.tsx`)가 **100% 더미 데이터**에 의존하는 현 상태를 종결시킨다. 데이터 인프라 → 도메인 API → 시각 라이트화 → 메인 통합 순으로 4차 발사하여, R1 종료 시점에 메인이 실데이터로 동작하고, 그 진입 경로(블로그·analysis·signal·market)도 라이트 톤으로 통일된다.

## 1. 작업 매트릭스

| ID | 이름 | 책임 영역 | 차수 | 의존 |
|---|---|---|---|---|
| **T01** | community-migrations | community_* 4 테이블 마이그레이션 + SCHEMA 갱신 | 1차 | — |
| **T02** | community-seed | 시드 스크립트 + 더미 50글 적재 | 2차 | T01 |
| **T03** | ticker-ssot | Binance ticker SSOT 확장 + `/api/coins/ticker` | 1차 | — |
| **T04** | fng-proxy | Alternative.me FNG 프록시 + `/api/fng` | 1차 | — |
| **T05** | news-classifier | 룰베이스 분류 + 키워드 사전 (lib/news/) | 1차 | — |
| **T06** | news-classify-integration | news 테이블 ALTER + crawler·API 통합 | 2차 | T05 |
| **T07** | auth-middleware | 익명 bcrypt + IP 마스킹 + middleware.ts | 1차 | — |
| **T08** | chart-theme + editor-tone | TradingView 라이트 테마 + BlogEditor tone props | 1차 | — |
| **T09** | blog-lightify | 블로그 페이지 4종 라이트화 | 2차 | T08 |
| **T10** | analysis-lightify | analysis 페이지 4종 라이트화 | 2차 | T08 |
| **T11** | signal-market-lightify | signal·market·stock-market 라이트화 | 2차 | T08 |
| **T12** | board-api | `/api/board/*` + `/api/community/*` CRUD | 3차 | T01, T07 |
| **T13** | hot-issues-rpc | hot-issues 집계 RPC + `/api/coins/hot-issues` | 3차 | T01 |
| **T14** | translations-cleanup | 번역 키 정리 + 헤더 인라인 분기 제거 | 1차 | — |
| **T15** | mainpage-realdata | `app/page.tsx` 더미 제거 + 실데이터 SSR 연결 | 4차 | T01, T02, T03, T04, T06, T12, T13 |

## 2. 발사 차수 DAG

```
1차 (즉시·8개 병렬):  T01 ─┐                       ┌─ T02 (2차)
                       T03  │                       ├─ T06 (2차) ← T05
                       T04  ├─ 의존 없음 ─ 즉시 발사 ─┼─ T09 (2차) ← T08
                       T05  │                       ├─ T10 (2차) ← T08
                       T07  │                       ├─ T11 (2차) ← T08
                       T08  │                       ├─ T12 (3차) ← T01, T07
                       T14 ─┘                       ├─ T13 (3차) ← T01
                                                    └─ T15 (4차) ← T01·T02·T03·T04·T06·T12·T13
```

| 차수 | 발사 시점 | 작업 |
|---|---|---|
| 1차 | 즉시 (8개) | T01·T03·T04·T05·T07·T08·T14 + (T02 대기) |
| 2차 | T01·T05·T08 handover 회수 후 (4개) | T02·T06·T09·T10·T11 |
| 3차 | T01·T07 handover 회수 후 (2개) | T12·T13 |
| 4차 | T01·T02·T03·T04·T06·T12·T13 회수 후 (1개) | T15 |

> 실용적 운영: 1차 7개(T02 제외) 동시 발사 후, T01 완료 시점에 T02 별도 발사. 2차·3차도 사전 발사 가능(파일은 작성하되 의존 데이터는 의존 작업 완료 후 적용).

## 3. 충돌 격리 매트릭스

| 디렉토리 | T01 | T02 | T03 | T04 | T05 | T06 | T07 | T08 | T09 | T10 | T11 | T12 | T13 | T14 | T15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| supabase/migrations/ | ✓ | | | | | ✓ | | | | | | | ✓ | | |
| scripts/ | | ✓ | | | | | | | | | | | | | |
| lib/supabase/crypto.ts | | | ✓ | | | | | | | | | | | | |
| app/api/coins/ticker/ | | | ✓ | | | | | | | | | | | | |
| app/api/coins/hot-issues/ | | | | | | | | | | | | | ✓ | | |
| app/api/fng/ | | | | ✓ | | | | | | | | | | | |
| lib/community/fng.ts | | | | ✓ | | | | | | | | | | | |
| lib/news/ | | | | | ✓ | ✓ | | | | | | | | | |
| app/api/news/ | | | | | | ✓ | | | | | | | | | |
| app/api/admin/news-crawl/ | | | | | | ✓ | | | | | | | | | |
| lib/community/auth.ts·ip-mask.ts | | | | | | | ✓ | | | | | | | | |
| middleware.ts | | | | | | | ✓ | | | | | | | | |
| lib/chart/ | | | | | | | | ✓ | | | | | | | |
| components/blog/BlogEditor.tsx | | | | | | | | ✓ | | | | | | | |
| app/blog/ + components/blog/* (BlogEditor 제외) | | | | | | | | | ✓ | | | | | | |
| app/analysis/ + components/analysis/ | | | | | | | | | | ✓ | | | | | |
| app/signal/ + app/market/ + app/stock-market/ | | | | | | | | | | | ✓ | | | | |
| app/api/board/ + app/api/community/ | | | | | | | | | | | | ✓ | | | |
| lib/translations.ts + components/global-header.tsx | | | | | | | | | | | | | | ✓ | |
| app/page.tsx + lib/community/queries.ts + mock-*.ts | | | | | | | | | | | | | | | ✓ |
| docs/references/_SCHEMA_REFERENCE.md | ✓ | | | | | △ | | | | | | | △ | | |
| docs/references/_API_REFERENCE.md | | | ✓ | ✓ | | ✓ | | | | | | ✓ | ✓ | | |
| docs/references/_ENV_REFERENCE.md | | | | ✓ | | | ✓ | | | | | | | | |
| docs/references/_TYPE_REFERENCE.md | | | ✓ | | ✓ | | | | | | | ✓ | | | |

> `△` = append-only (기존 줄 수정 금지, 자기 섹션만 추가). references는 일꾼 모두 마지막에 자기 섹션 1개 append 허용 — 충돌 시 다음 라운드 인덱스 정렬.

> supabase/migrations/는 T01·T06·T13이 공유하지만 **파일명 분할**로 격리:
> - T01: `20260523_create_community_tables.sql`
> - T06: `20260523_alter_news_classify.sql`
> - T13: `20260523_create_hot_issues_rpc.sql`

## 4. 안티패턴 (15 일꾼 공통)

1. **자기 디렉토리 밖 수정** → PreToolUse hook이 차단. 우회 금지.
2. **공통 SOT(CLAUDE.md, docs/references/, docs/rules/, .claude/settings.json) 수정** → 차단. 변경 필요 시 handover 본문에 "CEO 요청" 섹션 작성.
3. **다른 일꾼의 산출물을 임의로 호출하는 임포트** → 의존 일꾼 완료 전 임포트 금지. lazy resolve 또는 mock interface 사용.
4. **마이그레이션 파일명 충돌** → 위 §3의 파일명 규약 준수.
5. **mock-* 파일 직접 삭제** → T15 외 일꾼은 mock 데이터 파일 절대 삭제 금지.
6. **handover 누락 또는 양식 위반** → 완료 신호 없음 = 미완료 처리.
7. **검증 명령 미실행 + 통과 주장** → `npx tsc --noEmit` + 작업별 추가 검증 필수.

## 5. handover 양식 (모든 일꾼 공통)

파일명: `docs/handover/2026-05-23-R1-T0N-<short-name>.md`

```markdown
# T0N — <이름> handover (R1)

## 1. 완료 여부
- 전체: PASS / FAIL / PARTIAL
- 자가 검증: PASS / FAIL (명령·결과 첨부)

## 2. 작업 산출물 (절대 경로)
- 신규: ...
- 수정: ...
- 삭제: ...

## 3. 의사 결정
- 결정 1: 이유
- 결정 2: 이유

## 4. 미해결 / 의존 작업으로 이월
- ...

## 5. 검증 증거
\`\`\`
$ npx tsc --noEmit
... 출력 ...
\`\`\`

## 6. 다음 라운드 후보
- ...
```

## 6. R1 종료 조건

- T01·T02·T03·T04·T05·T06·T07·T08·T12·T13·T15 모두 PASS (메인 실데이터 핵심 경로)
- T09·T10·T11·T14는 PARTIAL 허용 (라이트화는 R2 분할 가능)
- `npm run build` 성공
- 메인 페이지에서 mock-* import 0건
- `_DISPATCH_CHECKPOINT.md` 라운드 상태 = `closed`

## 7. 참조

- 프로젝트 방향성: `docs/PROJECT_DIRECTION.md`
- 디자인 의뢰서: `docs/design-brief/`
- 최신 세션 handover: `docs/handover/2026-05-10-session7-stitch-applied.md`
- 현황표: `docs/status/current.md`
