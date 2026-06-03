# 인수인계서 — 세션 46 (양평 조치 회신 — batch SSOT 정렬 + supabaseAdmin lazy + insert silent failure 차단)

> 작성일: 2026-06-03
> 이전 세션: [session45](./2026-06-03-session45-ypmsg-coinchart.md)
> 저널: 없음 (대화 히스토리로 작성)

---

## 작업 요약
양평 서버(stylelucky4u.com) 메신저로 받은 daily-cron 자체호스팅 조치 요청 4건을 검증·처리. 코드 3건(#1 수집/분석 SSOT 정렬, #4 supabaseAdmin lazy화, #2 insert .error silent failure 차단)을 반영·검증하고 양평에 회신. #3 키 로테이션은 사용자 지시로 철회(개발 단계).

## 대화 다이제스트

### 토픽 1: 양평 메시지 확인
> **사용자**: "양평서버 메세지 확인"

`ypmsg_coinchart` 스킬로 `inbox`(미읽음 0) → `list` → DIRECT 방(`5dacf8e0…`) `read`. 양평 운영팀의 최신 안내(2026-06-03) 수신: daily-cron 자체호스팅 정상 가동(systemd --user 타이머, 첫 자동실행 06:00 KST exit 0, 5/8 succeeded, 리포트 626자) + coinchart 측 조치 권장 4건.

**결론**: 미읽음 없음(이미 읽음 처리 상태). 4건 조치 요청을 사용자에게 요약 보고.

### 토픽 2: 판단 요청 + 코드 실측
> **사용자**: "너의 판단은?? 그리고 이프로젝트가 해야할 조치는?"

추측 금지 원칙에 따라 4건을 실제 코드로 검증:
- **#1 정렬 불일치 = 진짜 버그**: 수집 `SUPPORTED_COINS`(constants.ts) 6종 vs 분석 하드코딩(batch_analysis.ts:376) 8종. ADA/AVAX/DOT 미수집→0 candles, BCH 미분석→낭비. SSOT 위반이 근본.
- **#4 dotenv vs ESM**: `supabaseAdmin.ts:13`이 module-load 시점 createClient 즉시 실행, `daily_cron.ts`의 import(14행)가 dotenv.config(19행)보다 위 → 호이스팅으로 빈 env 로드.
- **#2 silent failure**: batch_runs(112)/batch_analysis_results(422)/alert_history(239) insert 후 `.error` 미검사. PostgREST 에러는 throw 아닌 `.error` 반환이라 try/catch가 못 잡음.
- **#3 키 로테이션**: 코드로 불가, 운영자 작업.

우선순위 제시(키 로테이션 🔴 → #1 🟠 → #4 🟡 → #2 🟡). 핵심 통찰: #1·#4 모두 "SSOT/단일 진입점 미준수"가 뿌리.

**결론**: AskUserQuestion으로 (a) 코인 셋, (b) 실행 범위 확인.

### 토픽 3: 코드 3건 일괄 구현
> **사용자 선택**: 코인 셋 = "8종으로 확대(ADA/AVAX/DOT 추가)" / 실행 범위 = "#1+#4+#2 코드 3건 일괄"

영향 범위 파악: `SUPPORTED_COINS` 사용처 4곳(update-market-data, analysis/page, admin/market-data, TradeModal — UI 드롭다운에도 자동 반영 = 의도된 효과). `supabaseAdmin` 사용처 6파일 → Proxy 패턴으로 무수정 호환.

구현:
- **#1**: constants.ts에 ADA/AVAX/DOT 추가(9종) + batch_analysis가 `SUPPORTED_COINS.map(symbol)` 참조.
- **#4**: supabaseAdmin을 Proxy lazy로 재작성(첫 접근 시 getClient, 메서드 bind).
- **#2**: 3개 테이블 insert/update에 `.error` 검사 + 전건 실패 시 `[CRITICAL]` 로그.

검증: `tsc --noEmit` exit 0, ESLint 통과(prefer-const 1건 수정), lazy 스모크 3/3(env 빈 상태 로드 생존 / 접근 시 throw / 주입 후 정상 생성).

**정직한 한계 명시**: 정렬은 "0 candles"는 해소하나 ① ADA/AVAX/DOT 5분봉 누적 전까지 첫 며칠 Insufficient 가능, ② 양평 §5 "5분봉 기대 vs 일봉 적재" 구조 이슈는 별개 잔존, ③ 테이블 PGRST205는 DB 작업.

**결론**: 양평 DIRECT 방에 회신 송신(`messageId=5a9915de`).

### 토픽 4: #3 철회
> **사용자**: "개발중인 상태이기 때문이 나중에 활성화되면 내가 알아서 할테니 삭제해."

키 로테이션은 개발 단계라 운영 활성화 시 사용자 직접 처리. 추적 대상 제외. 양평에 철회 정정 송신(`messageId=009a07d3` — "별도 추적/조치 불요, 후속 안내 불필요").

**결론**: 남은 실제 조치는 PGRST205 테이블 1건(개발 진척에 맞춰).

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | 코인 셋 9종 확대 | 6종 축소 / 9종 확대 / 8종 정확일치 | 분석 커버리지 최대화. 수집·분석·UI를 SUPPORTED_COINS SSOT로 통일 |
| 2 | supabaseAdmin Proxy lazy | getSupabaseAdmin() 함수 / Proxy | 호출처 6파일 무수정 호환 |
| 3 | insert 실패 시 throw 안 함 | throw / 로그만 | 테이블 부재 상태에서 매일 exit 1 죽는 것 방지. silent→loud(로그)로 최소 충족 |
| 4 | #3 키 로테이션 철회 | 추적 유지 / 철회 | 개발 단계, 운영자 직접 처리 예정 |

## 수정 파일 (5개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `lib/constants.ts` | `SUPPORTED_COINS`에 ADA/AVAX/DOT 추가 (6→9종) |
| 2 | `scripts/batch_analysis.ts` | 분석목록 하드코딩 → `SUPPORTED_COINS` 참조(SSOT) + batch_runs/batch_analysis_results insert·update `.error` 검사 + 전건 실패 `[CRITICAL]` |
| 3 | `scripts/alert_engine.ts` | `alert_history` insert `.error` 검사 (warn→error) |
| 4 | `lib/supabaseAdmin.ts` | module-load createClient → 첫 접근 lazy(Proxy + bind) |
| 5 | `docs/references/_API_REFERENCE.md` | 지원 코인 6종 → 9종 갱신 |

## 검증 결과
- `npx tsc --noEmit` — **exit 0**
- ESLint(변경 4파일) — 통과 (prefer-const 1건 수정 후)
- lazy 스모크 — **3/3** (STEP1 env 빈 상태 module-load 생존 / STEP2 접근 시 throw / STEP3 env 주입 후 정상)

## 터치하지 않은 영역
- update-market-data의 5분봉/일봉 적재 로직 (양평 §5 구조 이슈 — 별도 과제)
- batch_runs/batch_analysis_results/alert_history 테이블 생성 (DB 작업, PGRST205)
- report_generator ↔ batch_analysis 교차결합 (R17 후보, 미착수)

## 알려진 이슈
- 🟡 **PGRST205**: 3개 출력 테이블 PostgREST 스키마 부재. 코드는 실패를 `[CRITICAL]` 로그로 드러내지만 테이블 생성/스키마 reload는 DB 작업 필요. 개발 진척에 맞춰 진행.
- 🟡 ADA/AVAX/DOT 신규 수집 → 5분봉 누적 전까지 첫 며칠 Insufficient data 가능.
- 🟡 batch_analysis 5분봉 288개 기대 vs update-market-data 일봉 적재 구조 미스매치 (양평 §5).
- ~~🔴 service_role 키 로테이션~~ — 철회(개발 단계, 운영자 직접 처리).

## 다음 작업 제안
- 내일 06:00 KST 자동실행 후 cron.log 관측 (양평에 요청함): ADA/AVAX/DOT 0 candles 즉시 skip 여부 + batch_analysis_results 저장 성공/[CRITICAL] 여부.
- PGRST205 테이블 마이그레이션 (운영 활성화 시점).
- report_generator ↔ batch_analysis 교차결합 정리 (R17).

## Compound Knowledge
- [2026-06-03 supabaseAdmin lazy + PostgREST silent failure](../solutions/2026-06-03-supabaseadmin-lazy-and-postgrest-silent-failure.md)

---
[← handover/_index.md](./_index.md)
