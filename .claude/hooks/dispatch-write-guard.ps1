# PreToolUse(Edit, Write) hook — kdydispatch 격리 가드
# 본 파일은 {PROJECT}/.claude/hooks/dispatch-write-guard.ps1 로 복사되어 실행됨
#
# 책임:
#   1. 도구 인자에서 file_path 추출
#   2. 현재 터미널 역할 (DK_DISPATCH_ROLE) 확인
#   3. allowed_dirs 외 경로면 exit 2 (차단) + 메시지 송출
#
# 입력:
#   stdin으로 hook payload JSON 수신 (tool_name, tool_input.file_path 등)
#
# 격리 원리:
#   - $env:DK_DISPATCH_ROLE 미설정 = dispatch 미참여 터미널 → pass
#   - CEO는 archive 외 모든 디렉토리 허용
#   - lieutenant/squad/worker는 자기 allowed_dirs 만

$ErrorActionPreference = 'Stop'
$libPath = Join-Path $PSScriptRoot "_helpers\dispatch-lib.ps1"
if (-not (Test-Path $libPath)) { exit 0 }
. $libPath

try {
    # dispatch 미참여 터미널 → pass
    if (-not $env:DK_DISPATCH_ROLE) { exit 0 }

    # stdin에서 hook payload 읽기
    $stdin = [Console]::In.ReadToEnd()
    if (-not $stdin) { exit 0 }

    $payload = $null
    try { $payload = $stdin | ConvertFrom-Json } catch { exit 0 }
    if (-not $payload) { exit 0 }

    # tool_name 확인 (Edit / Write만 가드)
    $toolName = [string]$payload.tool_name
    if ($toolName -ne "Edit" -and $toolName -ne "Write") { exit 0 }

    # file_path 추출
    $filePath = $null
    if ($payload.tool_input) {
        $filePath = [string]$payload.tool_input.file_path
    }
    if (-not $filePath) { exit 0 }

    # allowed_dirs 파싱
    $allowed = @()
    if ($env:DK_DISPATCH_ALLOWED) {
        $allowed = $env:DK_DISPATCH_ALLOWED -split ';' | Where-Object { $_ }
    }

    $role = $env:DK_DISPATCH_ROLE
    $group = $env:DK_DISPATCH_GROUP

    # 공통 SOT 추가 차단 (CEO 외 전부)
    if ($role -ne "ceo") {
        $sotPatterns = @(
            "*\CLAUDE.md",
            "*\docs\references\*",
            "*\docs\rules\*",
            "*\.claude\settings.json",
            "*\.claude\hooks\*"
        )
        $abs = if ([System.IO.Path]::IsPathRooted($filePath)) {
            $filePath
        } else {
            Join-Path $PWD.Path $filePath
        }
        $abs = [System.IO.Path]::GetFullPath($abs)
        foreach ($pat in $sotPatterns) {
            if ($abs -like $pat) {
                $msg = "[kdydispatch 격리 위반] $role $group 은 공통 SOT 수정 불가: $filePath. 변경 필요 시 CEO에게 outbox로 요청."
                Add-RegistryEvent -Event "violation" -Payload @{
                    role = $role; group = $group; path = $filePath; reason = "common_sot"
                }
                # exit 2 = stderr 메시지 + 도구 호출 차단 (Claude가 메시지 보고 재시도)
                [Console]::Error.WriteLine($msg)
                exit 2
            }
        }
    }

    # allowed_dirs 검사
    if (-not (Test-PathAllowed -FilePath $filePath -AllowedDirs $allowed -Role $role)) {
        $allowedStr = ($allowed -join ', ')
        $msg = "[kdydispatch 격리 위반] $role $group 의 작업 허용 영역 외 수정 시도: $filePath. 허용 영역: $allowedStr. 다른 영역이 필요하면 CEO/팀장에게 outbox 요청."
        Add-RegistryEvent -Event "violation" -Payload @{
            role = $role; group = $group; path = $filePath; reason = "out_of_allowed"; allowed = $allowedStr
        }
        [Console]::Error.WriteLine($msg)
        exit 2
    }

    # 통과
    exit 0
} catch {
    # 가드 자체 에러 시 silent fail (방해 금지)
    try {
        Add-RegistryEvent -Event "guard_error" -Payload @{ error = $_.Exception.Message }
    } catch {}
    exit 0
}
