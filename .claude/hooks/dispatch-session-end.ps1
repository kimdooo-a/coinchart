# SessionEnd hook — kdydispatch 마커 archive 이동
# 본 파일은 {PROJECT}/.claude/hooks/dispatch-session-end.ps1 로 복사되어 실행됨
#
# 책임:
#   1. 자기 마커 → .dispatch/archive/{Round}-{Date}/ 이동
#   2. handover 작성 여부 확인 (worker만)
#   3. _registry.jsonl 에 session_end 이벤트 기록

$ErrorActionPreference = 'Stop'
$libPath = Join-Path $PSScriptRoot "_helpers\dispatch-lib.ps1"
if (-not (Test-Path $libPath)) { exit 0 }
. $libPath

try {
    # dispatch 미참여 터미널 → pass
    if (-not $env:DK_DISPATCH_ROLE) { exit 0 }
    if (-not $env:DK_DISPATCH_MARKER) { exit 0 }

    $markerPath = $env:DK_DISPATCH_MARKER
    if (-not (Test-Path $markerPath)) {
        # 이미 archive로 이동되었거나 삭제됨
        exit 0
    }

    $role = $env:DK_DISPATCH_ROLE
    $group = $env:DK_DISPATCH_GROUP
    $round = if ($env:DK_DISPATCH_ROUND) { $env:DK_DISPATCH_ROUND } else { "Rx" }

    # 1. handover 작성 검사 (worker / squad / lieutenant)
    $handoverWarning = $null
    if ($role -ne "ceo") {
        $handoverDir = Join-Path $PWD.Path "docs\handover"
        $today = Get-Date -Format 'yyyy-MM-dd'
        # 오늘 날짜 + round + group 패턴 매칭
        $pattern = "*$today*$round*$group*.md"
        $found = $null
        if (Test-Path $handoverDir) {
            $found = Get-ChildItem -Path $handoverDir -Filter $pattern -ErrorAction SilentlyContinue
        }
        if (-not $found) {
            $handoverWarning = "handover 파일 미작성 (예상 패턴: $pattern)"
        }
    }

    # 2. archive 디렉토리로 마커 이동
    $archiveDir = Get-ArchiveDir -Round $round
    $markerName = Split-Path -Leaf $markerPath

    # 마커 부모 디렉토리 구조 일부 보존 (e.g. teams/T01-frontend/lead.lock → teams_T01-frontend_lead.lock)
    $relParent = (Split-Path -Parent $markerPath).Replace((Get-DispatchRoot), '').TrimStart('\','/').Replace('\','_').Replace('/','_')
    if ($relParent) {
        $archiveName = "$relParent`_$markerName"
    } else {
        $archiveName = $markerName
    }
    $archivePath = Join-Path $archiveDir $archiveName

    try {
        Move-Item -Path $markerPath -Destination $archivePath -Force
    } catch {
        # 이동 실패 시 copy + delete 폴백
        try {
            Copy-Item -Path $markerPath -Destination $archivePath -Force
            Remove-Item -Path $markerPath -Force
        } catch {
            # 두 번째 실패도 silent — 다음 cs/inception에서 정리
        }
    }

    # 3. 빈 디렉토리 정리 (선택 — workers/ 빈 폴더 제거)
    $markerParent = Split-Path -Parent $markerPath
    if ((Test-Path $markerParent) -and -not (Get-ChildItem -Path $markerParent -ErrorAction SilentlyContinue)) {
        try { Remove-Item -Path $markerParent -Force -ErrorAction SilentlyContinue } catch {}
    }

    # 4. registry 이벤트
    $payload = @{
        role = $role
        group = $group
        round = $round
        archive = $archivePath
    }
    if ($handoverWarning) { $payload.warning = $handoverWarning }
    Add-RegistryEvent -Event "session_end" -Payload $payload

    # 5. 환경변수 정리 (이 PowerShell 종료 직전이라 사실상 의미 없지만 명시)
    Remove-Item Env:DK_DISPATCH_ROLE -ErrorAction SilentlyContinue
    Remove-Item Env:DK_DISPATCH_GROUP -ErrorAction SilentlyContinue
    Remove-Item Env:DK_DISPATCH_ROUND -ErrorAction SilentlyContinue
    Remove-Item Env:DK_DISPATCH_PARENT -ErrorAction SilentlyContinue
    Remove-Item Env:DK_DISPATCH_ALLOWED -ErrorAction SilentlyContinue
    Remove-Item Env:DK_DISPATCH_MARKER -ErrorAction SilentlyContinue

    exit 0
} catch {
    try {
        Add-RegistryEvent -Event "session_end_error" -Payload @{ error = $_.Exception.Message }
    } catch {}
    exit 0
}
