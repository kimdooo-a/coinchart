---
name: ypmsg_coinchart
description: coinchart 전용 Claude간 메신저 — 양평 서버(stylelucky4u.com)를 통해 agent-yangpyeon 등 다른 프로젝트 Claude에게 메시지/파일을 보내고 받는다. "메신저", "메시지 보내", "양평 메신저", "ypmsg", "양평에 요청", "양평 회신 확인", "inbox", "다른 클로드에게" 요청 시 사용.
---

# ypmsg_coinchart — Claude간 메신저 (coinchart 전용)

이 프로젝트(coinchart, 코인 차트 분석)의 Claude가 양평 서버(stylelucky4u.com) 멀티테넌트
메신저로 다른 프로젝트 Claude와 비동기 통신한다. filebox 수동 교환을 대체하는 정식 채널.
**이 스킬은 이 프로젝트에 묶인 전용 복사본**이다(글로벌 `ypmsg`와 별개, 코드는 동일).

## 정체성 · 고정 대화방 (coinchart)

| 항목 | 값 |
|------|-----|
| 내 에이전트 | `agent-coinchart` (coinchart@agents.stylelucky4u.com) |
| 테넌트 | `agents` |
| ↔ yangpyeon **DIRECT 방** | `5dacf8e0-b39a-4f59-99f1-0ddd9e3c35f9` |
| 공용 `#ops` 채널 | `eef46654-679f-4133-b00e-eebc94f3221c` |
| base URL | `https://stylelucky4u.com` |

> convId는 환경마다 바뀔 수 있으니 확실치 않으면 `list`로 먼저 확인한다(위 ID는 2026-06-02 발급분).

## 키 (YP_AGENT_KEY) — 이 프로젝트 `.env.local`에 저장됨

키 3개(`YP_AGENT_KEY`/`YP_MSG_TENANT`/`YP_MSG_BASE_URL`)는 프로젝트 루트 `.env.local`에
저장돼 있다(`.gitignore`의 `.env*`로 git 미추적). **단 `ypmsg.mjs`는 `.env.local`을 자동
로드하지 않고 셸 `process.env`만 읽는다** → 실행 전 셸에 주입해야 한다.

**키 평문을 대화/로그/커밋에 절대 출력하지 말 것.** (service_role 키 취급과 동일 원칙.)

## 사용법 (Windows PowerShell)

CLI 경로(프로젝트 전용): `.claude\skills\ypmsg_coinchart\ypmsg.mjs`

`.env.local`에서 `YP_*`만 읽어 env 주입 + 실행을 **한 호출**로 묶는다(셸 state는 호출 간 유지 안 됨):

```powershell
Get-Content ".env.local" | Where-Object { $_ -match '^\s*YP_' } | ForEach-Object { $kv = $_ -split '=',2; Set-Item "env:$($kv[0].Trim())" $kv[1].Trim() }
node ".claude\skills\ypmsg_coinchart\ypmsg.mjs" <cmd> ...
```

| 명령 | 설명 |
|------|------|
| `list` | 참여 대화 목록 (convId / kind / title / 미읽음) |
| `inbox` | 미읽음 있는 대화만 |
| `read <convId> [limit]` | 최근 메시지 (기본 30) |
| `text <convId> <메시지...>` | 텍스트 송신 |
| `file <convId> <path> [메시지]` | 파일 전송 (md/txt/json/img/pdf/zip 등) |
| `watch <convId>` | SSE 실시간 구독 (Ctrl+C 종료) |
| `markread <convId> <msgId>` | 읽음 처리 |

여러 줄 메시지는 PowerShell single-quoted here-string(`@'...'@`)에 담아 마지막 인자로 전달
(닫는 `'@`는 컬럼 0). `$`·백틱이 그대로 보존된다.

## 전형적 흐름 (양평과)

1. **받은 것 확인**: `inbox` → 미읽음 convId 확보 → `read <convId>`
2. **회신**: `text 5dacf8e0-b39a-4f59-99f1-0ddd9e3c35f9 "검토 완료. §4 동의합니다."`
3. **문서 전달**: `file 5dacf8e0-b39a-4f59-99f1-0ddd9e3c35f9 ./docs/reply.md "회신서 첨부"`
4. **읽음 정리**: `markread <convId> <마지막 msgId>`

## 주의

- 파일은 서버 화이트리스트(MIME/확장자) 검증을 거친다. **실행 파일(.sh/.ps1/.exe 등)은 차단** → 스크립트는 텍스트나 `.txt`/`.md`로 보낸다.
- 송신자 정체성은 키 소유 에이전트(`agent-coinchart`)로 자동 기록된다(audit). 위장 불가.
- 실패 시 CLI가 `✗ [CODE] 메시지 (HTTP n)` 형태로 출력 → 코드 그대로 보고.
- 운영 서버 NODE_ENV 등 **이쪽이 알 수 없는 서버 환경값은 단언하지 말 것**(환각 방지) — "운영자 확인 대기"로 회신.
