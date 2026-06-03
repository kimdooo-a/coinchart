# 인수인계서 — 세션 47 (PGRST205 종료 + R17 교차결합 정리, kdyswarm 2트랙)

> 작성일: 2026-06-03
> 이전 세션: [session46](./2026-06-03-session46-batch-ssot-lazy-silentfailure.md)
> 저널: 없음 (대화 히스토리로 작성)

---

## 작업 요약
세션46이 인계한 미해결 #1(PGRST205 테이블)·#3(R17 교차결합)을 **kdyswarm 2트랙 worktree 병렬**로 동시 마감. T1=batch 출력 3테이블 마이그레이션 신규 작성 + 운영 DB 적용(Management API)으로 **PGRST205 종료**. T2=`report_generator`↔`batch_analysis` 교차결합 정리로 **R16 보류 1건 마감**(+ any가 가린 잠복 카운트 버그 교정).

## 대화 다이제스트

### 토픽 1: 새 세션 시작 + 작업 결정
> **사용자**: "새로운 세션 진행 … ✅ 세션 46 종료 완료"

`current.md`+세션46 handover로 상태 점검. 미해결 3건(PGRST205·06:00 관측·R17) 확인. 양평 inbox `inbox` → **미읽음 0**(다음 06:00 자동실행은 2026-06-04, 미회신). AskUserQuestion으로 작업 방향 질의.

> **사용자 선택**: "모두 진행하되, kdydispatch --kdyswarm 적극 활용"

06:00 관측(#2)은 대기로 두고, 지금 진행 가능한 PGRST205(#1)·R17(#3)을 분산 라운드로 설계하기로.

**결론**: kdydispatch 진입.

### 토픽 2: 범위 정찰 (Explore 2병렬)
kdydispatch Phase 0~1. 라운드 설계에 필요한 두 작업의 실제 범위를 **Explore 2병렬**로 정찰:
- **PGRST205**: 마이그레이션 파일 0개 존재. `batch_runs`(11)/`batch_analysis_results`(5+uuid PK)/`alert_history`(10) 컬럼을 코드 insert(`scripts/batch_analysis.ts`·`alert_engine.ts`)에서 역설계. FK 2개(batch_id→batch_runs). 네이밍 `YYYYMMDDhhmmss`. 적용 경로=Management API(R4 런북).
- **R17**: `report_generator`가 `result.signals`(최상위, 부재)를 기대하나 실제는 `result.probability.signals`. `result?:any`가 tsc 무력화 중. 방안 B(최소 침해)=소비처 경로 정정+타입 좁히기.

**결론**: 작업이 2건·자율 진행 가능 → kdydispatch 자율 위임 게이트(`--subagent`→kdyswarm) 패턴. 외부 N-터미널 대신 **본 세션 worktree 병렬**. 쓰기 영역 disjoint(T1=migrations/SCHEMA vs T2=scripts/TYPE) 확인.

### 토픽 3: kdyswarm 2트랙 발사 + 통합
Pre-Flight(git clean·batch 마이그레이션 0·충돌 0) 통과 후 2 에이전트 worktree 격리 발사.
- **T1**: 마이그레이션 신규 + `_SCHEMA_REFERENCE` 갱신, 커밋 `b686a92`.
- **T2**: `report_generator`·`batch_analysis` 정리 + `_TYPE_REFERENCE`, tsc 0·eslint 0, 커밋 `e696349`.

**T2 추가 발견**: any가 가린 잠복 버그 — `signal.type`(IndicatorSignal엔 `.signal`) + 'buy'(실제 'BUY') 비교 → 런타임 buy/sell 카운트 항상 0. 경로·필드·대소문자 3중 정정으로 함께 교정.

머지: `git merge --no-ff` ×2, **충돌 0**(ort 자동). 통합 working tree에서 독립 재검증 — **전역 tsc 0·eslint 0**. worktree 정리 + `.gitignore`에 `.claude/worktrees/` 등록.

**결론**: 라운드 통합 완료. 사용자에게 다음 단계 질의.

### 토픽 4: 운영 DB 적용
> **사용자 선택**: "지금 적용" + "세션 종료(cs)"

R4 런북의 Management API `database/query` 경로(`SUPABASE_ACCESS_TOKENS`, project ref `enksnhshciyvllwfiwrm`, DB password 불요)로 적용.

**문제**: PowerShell `ConvertTo-Json`+`Invoke-RestMethod` 기본 전송이 한글 SQL 주석을 CP949로 인코딩 → 서버 malformed JSON(400, position 774=한글 지점).
**해결**: `[Text.Encoding]::UTF8.GetBytes()` + `ContentType "application/json; charset=utf-8"`로 바이트 전송 → **APPLY OK**.

검증: 3테이블 생성(컬럼 11/6/10·인덱스 3씩·RLS 정책 1씩·FK 0/1/1) → `NOTIFY pgrst, 'reload schema'` → `schema_migrations` `20260603000001` backfill → `_SCHEMA_REFERENCE` "미적용"→"적용 완료" 정정.

**결론**: **PGRST205 완전 종료**. 내일 06:00 KST cron부터 저장 정상 예상.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | kdyswarm worktree 병렬 (외부 분산 아님) | kdydispatch 외부 N-터미널 / kdyswarm 내부 | 작업 2건·자율 진행 가능 → 사용자 복붙 매개 불필요. dispatch 자율 위임 게이트 패턴 |
| 2 | R17 방안 B (최소 침해) | A 공유타입 신설 / B 소비처 정정 / C 분석함수 확장 | 동작 보존 + 근본 정정(probability.signals 실위치) 동시 충족. 영향 2파일 |
| 3 | PGRST205 운영 DB 즉시 적용 | 지금 / 보류 | 내일 06:00 cron이 바로 저장 성공 → PGRST205 즉시 해소 |
| 4 | alert status 'pending' CHECK 미적용 | CHECK 추가 / 미적용 | shouldSendAlert가 'pending' 필터 사용(fail-open) — 제한적 CHECK가 쿼리 깰 위험 회피 |

## 수정 파일 (6개)

| # | 파일 | 변경 내용 | 트랙 |
|---|------|-----------|------|
| 1 | `supabase/migrations/20260603000001_create_batch_tables.sql` | 신규 — batch 3테이블 CREATE(FK2·인덱스6·RLS) | T1 |
| 2 | `docs/references/_SCHEMA_REFERENCE.md` | batch_* 3테이블 섹션 추가 + 운영DB 적용완료 기록 | T1 |
| 3 | `scripts/report_generator.ts` | `result.signals`→`result.probability.signals` + `signal.type`→`signal.signal`(BUY) 정정 | T2 |
| 4 | `scripts/batch_analysis.ts` | `result?:any`→`AnalysisResult\|StockAnalysisResult` union + import 2 + disable 제거 | T2 |
| 5 | `docs/references/_TYPE_REFERENCE.md` | 배치 분석 타입 섹션 추가 | T2 |
| 6 | `.gitignore` | `.claude/worktrees/` 등록 | 지휘 |

## 검증 결과
- 통합 working tree **전역 `npx tsc --noEmit` — exit 0**
- `npx eslint scripts/report_generator.ts batch_analysis.ts alert_engine.ts` — exit 0
- 머지 충돌 0 (영역 disjoint, ort 자동)
- 운영 DB: 3테이블 생성 검증(컬럼·인덱스·RLS·FK 정확) + PostgREST schema reload + schema_migrations 정합

## 운영 DB 적용 기록 (PGRST205 종료)
- **방식**: Management API `database/query` (`SUPABASE_ACCESS_TOKENS`, DB password 불요), `BEGIN; … COMMIT;` 트랜잭션 1회.
- **검증 쿼리 결과**: batch_runs(11컬럼·idx3·정책1·FK0) · batch_analysis_results(6·3·1·1) · alert_history(10·3·1·1).
- **PostgREST**: `NOTIFY pgrst, 'reload schema'` 송신 → PGRST205 종료.
- **히스토리**: `schema_migrations`에 `20260603000001 create_batch_tables` backfill(최신 행, 로컬 파일과 1:1 정합 유지).

## 터치하지 않은 영역
- `scripts/alert_engine.ts` 로직 (insert 컬럼만 정찰 참조, 수정 0)
- `lib/analysis/orchestrator.ts`·`stock.ts` (타입 import만, 수정 0 — 방안 B는 분석함수 비확장)
- update-market-data 5분봉/일봉 적재 구조 (양평 §5, 별도 과제)

## 알려진 이슈
- 🟡 **내일 06:00 KST(2026-06-04) cron 저장 관측** — ADA/AVAX/DOT 0 candles 해소 여부 + `batch_analysis_results`/`batch_runs`/`alert_history` 저장 성공/[CRITICAL] 여부. 양평에 관측 요청됨.
- 🟡 **alert status 'pending' 불일치** — `shouldSendAlert`가 `status` 필터에 'pending'을 쓰나 코드는 'sent'/'failed'/'skipped'만 insert. CHECK 미적용으로 안전 처리. 추후 정리 후보.
- 🟡 5분봉 288개 기대 vs update-market-data 일봉 적재 구조 미스매치 (양평 §5).

## 다음 작업 제안
- 양평 06:00 관측 회신 확인 후 저장 정상 검증.
- alert status 'pending' 불일치 정리(코드 또는 스키마 일치).
- 5분봉/일봉 적재 구조 이슈(양평 §5) 별도 라운드.

## Compound Knowledge
- [2026-06-03 Management API에 한글 SQL 전송 시 UTF-8 바이트 인코딩](../solutions/2026-06-03-management-api-utf8-korean-sql.md)

---
[← handover/_index.md](./_index.md)
