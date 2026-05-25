---
title: .env.local UTF-8 BOM이 supabase CLI env 파서를 깨뜨림
date: 2026-05-25
session: 32
tags: [dotenv, bom, supabase-cli, powershell, encoding, env-local]
category: workaround
confidence: high
---

## 문제
`supabase link` / `supabase migration list` 실행 시:
```
failed to parse environment file: .env.local (unexpected character '»' in variable name)
```
로 거부된다. 같은 `.env.local`로 앱(Next.js)은 정상 동작한다.

## 원인
`.env.local` 선두 3바이트가 `EF BB BF`(UTF-8 BOM). supabase CLI의 env 파서는 첫 키 이름을 `<BOM>NEXT_PUBLIC_SUPABASE_URL`로 읽어 거부한다(`'»'`는 BOM 바이트의 latin-1 표기). Next.js dotenv는 BOM을 strip해 무시하므로 앱은 무영향 — **도구별 BOM 처리 차이**가 함정이다.

## 해결
- **임시 우회(읽기)**: PowerShell `Get-Content .env.local -Encoding UTF8`은 BOM을 strip하므로, `.env.local`을 파싱해 프로세스 env에 주입하는 경로(검증 스크립트·playwright env 주입)에선 정상 동작.
- **근본 해결**: `.env.local`을 UTF-8(no BOM)로 재저장(내용 불변). 단 `.env*`는 커밋 금지 민감 파일이라 사용자 승인 후.
- **진단 팁**: grep `^KEY=` 앵커가 **첫 줄만** 매칭 실패하면 BOM 의심. 확인: `[IO.File]::ReadAllBytes(path)[0..2]` == `EF BB BF`.

## 교훈
환경파일 파서는 BOM 처리가 제각각이다(Next.js=strip, supabase CLI=거부). 첫 줄 키만 인식 안 되면 즉시 BOM을 확인하라. CLI가 막혀도 Management API `database/query`(access token, db password 불요)는 우회 경로가 된다.

## 관련 파일
- `.env.local` (BOM, 커밋 금지)
