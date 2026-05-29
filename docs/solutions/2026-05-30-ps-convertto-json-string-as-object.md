---
title: PowerShell 5.1 ConvertTo-Json이 멀티라인 문자열을 객체로 직렬화 → Supabase Management API 400
date: 2026-05-30
session: 39
tags: [powershell, convertto-json, supabase, management-api, migration, windows]
category: workaround
confidence: high
---

## 문제

운영 DB에 마이그레이션을 Supabase Management API(`POST /v1/projects/{ref}/database/query`)로 적용하려 했으나 400:

```
{"message":"query: Expected string, received object"}
```

`@{ query = $sql } | ConvertTo-Json`로 body를 만들었고 `$sql`은 `Get-Content -Raw`로 읽은 `System.String`(GetType 확인됨)인데도, 직렬화 결과가 문자열이 아니라 객체였다:

```
{ "query": { "value": "-- ...\n...", "Count": ..., "Length": ... } }
```

API는 `query`가 string이길 기대하는데 `{value, Count, Length}` 객체를 받아 거부.

## 원인

Windows PowerShell 5.1의 `ConvertTo-Json`은 **여러 줄(CRLF 포함) 문자열**을 스칼라가 아니라 `value`/`Count`/`Length` NoteProperty를 가진 객체로 직렬화하는 경우가 있다(5.1 한정 동작; PowerShell 7+에서는 정상). `GetType()`이 `System.String`이어도 발생하므로 캐스팅(`[string]`)만으로는 회피되지 않는다.

부차적으로, `Get-Content -Raw`를 인코딩 지정 없이 쓰면 시스템 기본 코드페이지(한국어 환경 cp949)로 UTF-8 한글 주석이 깨진다(DDL 자체는 ASCII라 적용엔 무해하나 주석 보존 위해 `-Encoding UTF8` 권장).

## 해결

`ConvertTo-Json`으로 wrapper 객체를 만들지 말고, **문자열만 .NET으로 JSON 인코딩**한 뒤 수동으로 wrap하고 UTF-8 bytes로 전송:

```powershell
Add-Type -AssemblyName System.Web
$sql  = [string](Get-Content -Raw -Encoding UTF8 'supabase/migrations/xxx.sql')
$enc  = [System.Web.HttpUtility]::JavaScriptStringEncode($sql, $true)  # 따옴표 포함 escape
$body = '{"query":' + $enc + '}'
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
Invoke-RestMethod -Method Post `
  -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
  -Headers @{ Authorization = "Bearer $tok" } `
  -ContentType 'application/json; charset=utf-8' -Body $bytes
```

- 토큰은 `.env.local`의 `SUPABASE_ACCESS_TOKENS`에서 파싱(DB password 불요). 값은 출력하지 않음.
- DDL이 idempotent(`IF NOT EXISTS`·`DROP POLICY IF EXISTS`)면 재실행 안전.
- 적용 후 `information_schema.columns`·`pg_policies`·`pg_class.relrowsecurity`로 검증, `supabase_migrations.schema_migrations`에 14자리 version backfill(`ON CONFLICT DO NOTHING`).

## 교훈

- PS 5.1에서 **API JSON body의 문자열 필드는 `@{}|ConvertTo-Json` 대신 `JavaScriptStringEncode` + 수동 wrap**으로 만들면 멀티라인 함정을 피한다. (또는 PowerShell 7 `pwsh` 사용.)
- 이 프로젝트의 운영 DB 변경은 supabase CLI가 아니라 **Management API `database/query`** 경로가 표준(`.env.local` UTF-8 BOM이 CLI env 파서를 막음 — [[env-local-utf8-bom]]). 런북 `docs/db/R4-db-apply-runbook.md` §8·§10.

## 관련 파일
- `supabase/migrations/20260529000001_create_user_watchlist.sql`
- `docs/db/R4-db-apply-runbook.md`
