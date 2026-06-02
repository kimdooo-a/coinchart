# 인수인계서 — 세션 44 (daily-cron 자체호스팅 런북 + Claude간 메신저 온보딩)

> 작성일: 2026-06-02
> 이전 세션: [session43 (R16 type-cleanup)](./2026-06-02-session43-r16-type-cleanup.md)
> 성격: 단독 세션 (코드 변경 없음 — 운영 문서 작성 + 외부 메신저 채널 연결)

---

## 작업 요약

R14부터 PENDING이던 **daily-cron(Daily Data Sync) GitHub Actions billing 차단** 대응. 결제 해소 대신 **운영자 자체 서버에서 cron을 직접 돌리는 런북**(`docs/DAILY_CRON_SELFHOST.md`)을 작성. 양평 서버(stylelucky4u.com) Claude의 교차 검토를 받아 v2로 보강(종료코드 유실 등 8건). 동시에 양평 **Claude간 메신저**에 `agent-coinchart`로 온보딩하여 양방향 채널 확립.

## 대화 다이제스트

### 토픽 1: 새 세션 시작 + "GitHub billing 왜 필요?"
> **사용자**: "🔴 (사용자 조치) GitHub kimdooo-a Billing 결제 차단 해소 ... 이게 왜 필요한거야?"

`daily-cron.yml`과 solution(`2026-05-30-public-repo-not-enough-account-billing-blocks-actions.md`)을 확인하여 설명:
- daily-cron은 매일 UTC 21:00에 뉴스·시세·배치분석 3스크립트를 실행해 Supabase를 채우는 워크플로우.
- 2026-05-24까지 정상 → 5-25부터 5회 연속 **3~4초 만에 실패**(job 시작 단계 차단). 메시지 = "recent account payments have failed".
- **레포 Public ≠ Actions 무료 보장**: 계정 결제 hold가 Public Actions까지 차단. R13의 "Public 전환=무료화" 전제가 불완전했음.
- 단 **실제 배포는 Vercel Git 자동배포**라 사이트는 200으로 살아있고, 멈춘 건 "매일 자동 데이터 갱신"뿐. v2.0 피벗 후 이 데이터가 실제로 쓰이는지 확인 필요(분석 단계 캔들 부족 이슈로 이어짐).

**결론**: billing은 daily-cron 재가동에만 필요. 코드/설정으론 해결 불가(순수 계정 결제 문제).

### 토픽 2: 자체 서버 운영 요청서 작성
> **사용자**: "데일리 크론을 내가 운영하는 서버에서 돌릴테니까. 너의 요청사항을 파일로 만들어줘."

코드 5개(`daily_cron.ts`→`batch_orchestrator`→`batch_analysis`/`report_generator`/`alert_engine`, `update-news.ts`, `update-market-data.ts`, `package.json`, `gates.ts`, `logger.ts`)를 직접 읽고 런북 v1 작성. 추측 없이 확인한 핵심 사실:
- **로그는 stdout/stderr로만** 나감(`createLogger`가 `console.*`만 — `daily_cron.log`는 접두사 라벨일 뿐 파일 미생성). 운영자가 리다이렉트 필요.
- **알림은 stub**(`sendAlert`가 `console.log`만) → **SMTP 환경변수 불필요**.
- **킬스위치(`NEXT_PUBLIC_DISABLE_AUTOMATION`)는 배치 경로에 미연결**(gates.ts 정의만, cron 스크립트가 호출 안 함).
- **필수 env 2개**: `NEXT_PUBLIC_SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`. TwelveData 키는 이 경로에서 실질 미사용.
- **순서 의존**: 분석(3단계)이 2단계 적재 `market_prices`/`stock_prices`를 읽음 → 1→2→3.
- **함정**: 분석은 5분봉 50개+ 기대인데 적재는 일봉 5일치 → "Insufficient data" 가능(기존 Actions도 동일 구조).

**결론**: `docs/DAILY_CRON_SELFHOST.md` v1 작성 + CLAUDE.md 개발 규칙 트리에 노드 등록.

### 토픽 3: 양평 Claude 교차 검토 수신 + 런북 v2
> **사용자**: 양평 서버 Claude(`agent-yangpyeon`)의 회신서 전달 — PART A(런북 검토) + PART B(메신저 온보딩).

양평 리뷰의 정확성 검증 후 모두 반영. 특히 **A-1 ① 종료코드 유실은 명백한 내 누락**:
- bash 스크립트 종료코드 = 마지막 명령. 래퍼 끝이 `echo`라 daily_cron이 `exit 1` 해도 래퍼는 **항상 0** → systemd oneshot 초록불·MAILTO 실패 메일 미발송. 알림 stub+킬스위치 미연결과 겹쳐 **실패가 무인 침묵**.
- **A-4 확인 요청 검증**: ④ dotenv = `path.resolve(__dirname, '../.env.local')` **`__dirname` 기준 확정**(CWD 무관). ② tsx = **devDependency 확정**, 운영 서버 NODE_ENV는 코드로 단언 불가.

**결론**: 런북 v2 — ① `rc=$?`+`exit $rc`, ② `npm ci --include=dev` 가드, ③ `cd \|\| exit 1`, ⑤ EnvironmentFile/dotenv 비호환 경고, ⑥ `Wants=network-online.target`, ⑦ Windows PATH+`$LASTEXITCODE`, A-3 nits(로그 chown·UTC/KST 날짜·멱등 TZ) 전부 반영.

### 토픽 4: Claude간 메신저 온보딩
> **사용자**: 양평이 발급한 키·DIRECT 방 정보를 전달(운영자가 provision 실행 + 키 주입).

- `ypmsg` 스킬(`~/.claude/skills/ypmsg/ypmsg.mjs`)·번들(`F:\11_dev\_external-repos\ypmsg-bundle`) 존재 확인.
- env 3개(`YP_AGENT_KEY`/`YP_MSG_TENANT=agents`/`YP_MSG_BASE_URL=https://stylelucky4u.com`)로 `list` → DIRECT 방·#ops 채널 확인(exit 0).
- A-4 회신 + 런북 v2 반영 보고를 DIRECT 방에 `text` 송신 **성공**(messageId 발급) → `read` 재조회로 게시 확인 = **양방향 round-trip 정상**.
- **NODE_ENV는 단언하지 않음** — 양평 예시 회신의 "production입니다"를 그대로 베끼면 환각이 되므로, "운영자 확인 대기"로 정직하게 회신.

**결론**: 메신저 연결 확립. 메모리(`inter-agent-messenger-coinchart.md`) 기록. 키는 env로만 사용, 파일·커밋·로그에 평문 미저장.

## 의사결정 요약

| # | 결정 | 선택지 | 선택 이유 |
|---|------|--------|----------|
| 1 | billing 해소 대신 자체 서버 cron | 결제 복구 / 자체 호스팅 | 사용자 결정. billing 우회 + 운영 통제권 |
| 2 | 런북에 NODE_ENV 가드 명시 | 무시 / `--include=dev` 가드 | tsx가 devDep이라 `NODE_ENV=production` 서버에서 누락 위험. 양쪽 안전 |
| 3 | NODE_ENV 실값 단언 안 함 | 양평 예시 복붙 / 운영자 확인 대기 | 운영 서버 환경값은 코드로 알 수 없음 — 환각 방지 |
| 4 | 메신저 연결(Skill 방식) | 미연결 / Skill / MCP | 운영자가 키 주입 완료. Skill이 셋업 0·문서 핸드오프에 적합. MCP는 보류 |

## 수정 파일 (3개)

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `docs/DAILY_CRON_SELFHOST.md` | **신규** — 자체호스팅 런북 v2(0~9장+부록, 양평 검토 8건 반영) |
| 2 | `CLAUDE.md` | 개발 규칙 표에 DAILY_CRON_SELFHOST.md 노드 추가 |
| 3 | (글로벌 메모리) `inter-agent-messenger-coinchart.md` + `MEMORY.md` | 메신저 연결 사실 기록 (레포 밖, git 비대상) |

## 검증 결과
- 코드 변경 없음 → tsc/build 미해당.
- 런북의 코드 사실 단언은 전부 실제 소스 Read로 검증(dotenv `__dirname`, tsx devDep, alert stub, 킬스위치 미연결, 로그 console-only).
- 메신저 round-trip: `list` exit 0 → `text` 송신 messageId 발급 → `read` 게시 확인. **정상**.

## 터치하지 않은 영역
- 코드/레퍼런스 변경 없음(`docs/references/` 무수정 — ENV 추가 없이 기존 env 사용).
- daily-cron.yml·배치 스크립트 자체 무수정(런북은 "기존 동작 그대로 이관"이 목표).
- `.mcp.json` 메신저 MCP 등록 보류(Skill 방식 채택).

## 알려진 이슈
- ⚠️ **분석 단계 캔들 부족(구조적)**: `batch_analysis`는 5분봉 50개+ 기대, `update-market-data`는 일봉 5일치만 적재 → `market_prices`에 5분봉을 채우는 별도 경로가 없으면 분석 결과가 대부분 비어 보임. **자체 호스팅과 무관하게 기존 Actions도 동일**. 런북 §7.2에 명시, 별도 과제로 분리 권장.
- 🔴 (사용자) GitHub `kimdooo-a` Billing — 자체 호스팅으로 **우회**되므로 daily-cron 목적상 더 이상 blocking 아님(다른 Actions 필요 시에만).
- 🔴 (사용자) watchlist 실 로그인 sync 스모크(R14부터, `docs/db/R14-watchlist-sync-smoke.md`).

## 다음 작업 제안
- **자체 호스팅 실행**: 운영자가 런북 §8 체크리스트대로 수동 1회 검증 → cron 등록. 운영 서버 NODE_ENV 값 확인 후 양평 DIRECT 방에 회신.
- **(코드) R17**: `batch_analysis result` ↔ `report_generator signals` 교차결합 마감(scripts any 완전 0).
- **(분리 과제)** 분석용 5분봉 적재 경로 점검 — daily-cron이 의미 있는 분석을 내려면 선행.
- 메신저: 양평 회신 도착 시 `read`로 확인. MCP 네이티브 도구 원하면 `.mcp.json` 등록.

---
[← handover/_index.md](./_index.md)
