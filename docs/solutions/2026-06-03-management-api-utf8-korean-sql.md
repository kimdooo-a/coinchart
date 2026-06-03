---
title: Supabase Management API에 한글 포함 SQL 전송 시 UTF-8 바이트 인코딩 필수 (PowerShell)
date: 2026-06-03
session: 47
tags: [supabase, management-api, powershell, utf-8, cp949, invoke-restmethod, convertto-json, migration]
category: tooling
confidence: high
---

## 문제
PowerShell에서 Supabase Management API(`POST /v1/projects/{ref}/database/query`)로 **한글 주석이 포함된 마이그레이션 SQL**을 전송하면 서버가 400을 반환:

```
{"message":"Expected ',' or '}' after property value in JSON at position 774 (line 2 column 772)"}
```

position 774는 SQL 본문의 **한글 주석 시작 지점**과 일치. JSON 자체는 `ConvertTo-Json`으로 올바르게 만들었는데도 서버가 malformed JSON으로 받음.

## 원인
PowerShell 5.1의 `Invoke-RestMethod -Body $string`은 본문 문자열을 **시스템 기본 코드페이지(한국어 Windows = CP949)**로 인코딩해 전송한다. 서버(PostgREST/Management API)는 UTF-8로 디코드하므로, 한글 바이트가 깨지면서 JSON 구조 문자(`,` `}` `"`)의 경계가 어긋나 파싱이 실패한다. 즉 **JSON 직렬화가 아니라 전송 바이트 인코딩**의 문제다.

## 해결
본문을 **UTF-8 바이트 배열로 명시 변환**하고 `charset=utf-8`을 붙여 전송:

```powershell
$payload = @{ query = $query } | ConvertTo-Json -Depth 3
$bytes   = [System.Text.Encoding]::UTF8.GetBytes($payload)   # ← 핵심
$resp = Invoke-RestMethod -Method Post `
  -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType "application/json; charset=utf-8" `
  -Body $bytes
```

부가 주의:
- `.env.local`이 **UTF-8 BOM**을 가지므로(이 프로젝트 기존 이슈), env 값 파싱 시 첫 줄 값에 `[char]0xFEFF`가 붙을 수 있다 → `.TrimStart([char]0xFEFF)`로 제거.
- DDL 성공 시 응답은 빈 배열/빈 본문(`=== APPLY OK ===`)이 정상.
- 멱등 마이그레이션이면 `BEGIN; … COMMIT;`로 감싸 원자 적용(부분 실패 자동 롤백).
- 적용 후 새 테이블이 PGRST205로 안 잡히면 `NOTIFY pgrst, 'reload schema';`를 같은 경로로 1회 송신.

## 교훈
- 한국어 Windows의 PowerShell `Invoke-RestMethod`는 비-ASCII 본문을 **CP949로 보낸다** — 한글/이모지가 든 JSON·SQL을 외부 API로 보낼 때는 항상 `[Text.Encoding]::UTF8.GetBytes()` + `charset=utf-8` 바이트 전송.
- "400 malformed JSON at position N"인데 JSON이 멀쩡해 보이면, N 위치의 **문자가 비-ASCII인지** 먼저 의심하라. 직렬화가 아니라 전송 인코딩 문제다.
- 이 프로젝트의 운영 DB 변경 표준 경로는 Management API `database/query`(`SUPABASE_ACCESS_TOKENS`, DB password 불요). [[env-local-utf8-bom]] BOM 이슈와 함께 다룬다.

## 관련 파일
- `docs/db/R4-db-apply-runbook.md` (§8·§10 Management API 적용 경로)
- `supabase/migrations/20260603000001_create_batch_tables.sql`
- `docs/references/_SCHEMA_REFERENCE.md`
