# SessionStart hook — kdydispatch 역할 주입
# 본 파일은 {PROJECT}/.claude/hooks/dispatch-role-injector.ps1 로 복사되어 실행됨
#
# 책임:
#   1. .dispatch/ 부재 시 즉시 종료 (평범 터미널 영향 0)
#   2. 현 PowerShell PID로 마커 매칭
#   3. 환경변수 + 터미널 타이틀 주입
#   4. _registry.jsonl 에 session_start 이벤트 기록
#
# 격리 보장:
#   - 이 hook은 프로젝트 .claude/settings.json 에만 등록됨
#   - 다른 프로젝트로 cd 시 그 프로젝트엔 본 hook 없음 → 자동 해제
#   - 환경변수는 이 PowerShell 프로세스 한정 (휘발성)

$ErrorActionPreference = 'Stop'
$libPath = Join-Path $PSScriptRoot "_helpers\dispatch-lib.ps1"
if (-not (Test-Path $libPath)) { exit 0 }
. $libPath

try {
    # Step 1: .dispatch 부재 검사
    if (Test-DispatchInactive) {
        # dispatch 미사용 프로젝트 — 아무 영향 없이 종료
        exit 0
    }

    # Step 2: 현 PID로 마커 매칭
    $match = Find-MarkerByPid -PidValue $PID
    if (-not $match) {
        # 마커 미매칭 — 이 터미널은 dispatch 미참여 (평범 모드)
        exit 0
    }

    $marker = $match.Data
    $markerFile = $match.File

    # Step 3: 마커에 PID 바인딩 (미바인딩 마커였던 경우)
    # NOTE: $marker.pid 직접 접근은 ETS에서 자동 변수 $PID 와 충돌하므로 Get-MarkerPid 우회.
    $boundPid = Get-MarkerPid -Data $marker
    if (-not $boundPid -or $boundPid -ne $PID) {
        Set-MarkerPid -MarkerPath $markerFile.FullName -NewPid $PID | Out-Null
    }

    # Step 4: 환경변수 주입 (이 PowerShell 세션 한정)
    $env:DK_DISPATCH_ROLE = [string]$marker.role
    $env:DK_DISPATCH_GROUP = if ($marker.group) { [string]$marker.group } else { "" }
    $env:DK_DISPATCH_ROUND = if ($marker.round) { [string]$marker.round } else { "" }
    $env:DK_DISPATCH_PARENT = if ($marker.parent) { [string]$marker.parent } else { "" }
    $env:DK_DISPATCH_MARKER = $markerFile.FullName

    # allowed_dirs는 세미콜론 구분 문자열로 (write-guard에서 split)
    if ($marker.allowed_dirs) {
        $env:DK_DISPATCH_ALLOWED = ($marker.allowed_dirs -join ';')
    } else {
        $env:DK_DISPATCH_ALLOWED = ""
    }

    # Step 5: 터미널 타이틀
    $projectName = Split-Path -Leaf $PWD.Path
    $roleLabel = switch ($marker.role) {
        "ceo"        { "지휘소" }
        "lieutenant" { "팀장" }
        "squad"      { "분대장" }
        "worker"     { "일꾼" }
        default      { $marker.role }
    }
    $groupTag = if ($marker.group) { " $($marker.group)" } else { "" }
    $title = "[$roleLabel$groupTag] $projectName"
    try {
        $Host.UI.RawUI.WindowTitle = $title
    } catch {
        # ConsoleHost 외 환경 (VS Code 등) — ANSI escape으로 폴백
        [Console]::Out.Write("`e]0;$title`a")
    }

    # Step 6: registry 이벤트 기록
    Add-RegistryEvent -Event "session_start" -Payload @{
        role = $marker.role
        group = $marker.group
        round = $marker.round
        marker = $markerFile.FullName
    }

    # Step 7: Claude 컨텍스트로 system 메시지 송출 (선택)
    # hook 표준 출력에 JSON 메시지를 stdout으로 보내면 Claude가 컨텍스트로 수신
    $msg = @{
        hookSpecificOutput = @{
            hookEventName = "SessionStart"
            additionalContext = "[kdydispatch] 본 터미널 역할: $roleLabel$groupTag ($($marker.round)). 작업 허용 영역: $($env:DK_DISPATCH_ALLOWED). 그 외 디렉토리 수정 시도는 PreToolUse hook이 차단합니다."
        }
    } | ConvertTo-Json -Compress -Depth 6
    Write-Output $msg

    exit 0
} catch {
    # 에러 발생 시 silent fail — hook이 평범 터미널을 방해하면 안됨
    Add-RegistryEvent -Event "injector_error" -Payload @{ error = $_.Exception.Message }
    exit 0
}
