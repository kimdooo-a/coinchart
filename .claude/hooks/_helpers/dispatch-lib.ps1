# kdydispatch hooks 공통 라이브러리
# 프로젝트 한정 — 본 파일은 {PROJECT}/.claude/hooks/_helpers/ 로 복사됨

<#
.SYNOPSIS
공통 함수: 마커 매칭, 격리 검사, registry append, 경로 정규화.

.NOTES
- 모든 함수는 부수효과 없이 순수 결과 반환 또는 명시적 IO만 수행
- 실패 시 throw 대신 $null 반환 (hook은 silent fail이 안전)
#>

# .dispatch 디렉토리 SOT 위치
function Get-DispatchRoot {
    param([string]$ProjectRoot = $PWD.Path)
    return Join-Path $ProjectRoot ".dispatch"
}

# .dispatch 부재 검사 (true = dispatch 미사용 프로젝트)
function Test-DispatchInactive {
    param([string]$ProjectRoot = $PWD.Path)
    $root = Get-DispatchRoot -ProjectRoot $ProjectRoot
    return -not (Test-Path $root)
}

# 모든 활성 마커 파일 수집 (archive 제외)
function Get-ActiveMarkers {
    param([string]$ProjectRoot = $PWD.Path)
    $root = Get-DispatchRoot -ProjectRoot $ProjectRoot
    if (-not (Test-Path $root)) { return @() }

    $patterns = @(
        "ceo\current.lock",
        "teams\*\lead.lock",
        "teams\*\squads\*\leader.lock",
        "teams\*\workers\*.lock"
    )
    $results = @()
    foreach ($pat in $patterns) {
        $full = Join-Path $root $pat
        $found = Get-ChildItem -Path $full -ErrorAction SilentlyContinue
        if ($found) { $results += $found }
    }
    return $results
}

# 마커 JSON 파싱 (실패 시 $null)
function Read-MarkerJson {
    param([string]$Path)
    try {
        $raw = Get-Content -Raw -Path $Path -Encoding UTF8 -ErrorAction Stop
        return ConvertFrom-Json -InputObject $raw -ErrorAction Stop
    } catch {
        return $null
    }
}

# PID로 마커 매칭. 우선순위:
#   1. processId 필드가 현재 PID와 일치하는 마커
#   2. processId 필드가 0 또는 null인 미바인딩 마커 중 가장 최근 작성
# NOTE: 마커 스키마 키는 processId로 통일 (PowerShell 5.1 ETS 자동 변수 $PID 충돌 회피).
#       호환성: 구 스키마(pid)도 fallback으로 읽되, 신규 쓰기는 processId만.
function Find-MarkerByPid {
    param(
        [int]$PidValue = $PID,
        [string]$ProjectRoot = $PWD.Path
    )
    $markers = Get-ActiveMarkers -ProjectRoot $ProjectRoot
    if (-not $markers) { return $null }

    # 1순위: 정확 PID 일치 (신/구 스키마 모두 검사)
    foreach ($m in $markers) {
        $data = Read-MarkerJson -Path $m.FullName
        if (-not $data) { continue }
        $bound = Get-MarkerPid -Data $data
        if ($bound -eq $PidValue) {
            return [PSCustomObject]@{ File = $m; Data = $data }
        }
    }

    # 2순위: 미바인딩 마커 중 가장 최근
    $unbound = @()
    foreach ($m in $markers) {
        $data = Read-MarkerJson -Path $m.FullName
        if (-not $data) { continue }
        $bound = Get-MarkerPid -Data $data
        if (-not $bound -or $bound -eq 0) {
            $unbound += [PSCustomObject]@{ File = $m; Data = $data }
        }
    }
    if ($unbound.Count -eq 0) { return $null }
    return $unbound | Sort-Object { $_.File.LastWriteTime } -Descending | Select-Object -First 1
}

# 마커 데이터에서 PID 값을 안전하게 추출 (processId 우선, pid는 구 스키마 fallback).
# PSObject.Properties 경로로 접근하여 ETS 자동 변수 충돌 회피.
function Get-MarkerPid {
    param([Parameter(Mandatory=$true)]$Data)
    $props = $Data.PSObject.Properties
    $p = $props['processId']
    if ($p -and $p.Value) { return [int]$p.Value }
    $p = $props['pid']
    if ($p -and $p.Value) { return [int]$p.Value }
    return 0
}

# 마커에 현재 PID 바인딩 (신 스키마 processId 사용).
# 구 스키마(pid)가 남아 있으면 제거하여 단일 진실의 원천 유지.
function Set-MarkerPid {
    param(
        [string]$MarkerPath,
        [int]$NewPid = $PID
    )
    $data = Read-MarkerJson -Path $MarkerPath
    if (-not $data) { return $false }
    # 구 스키마 정리
    if ($data.PSObject.Properties['pid']) {
        $data.PSObject.Properties.Remove('pid')
    }
    # 신 스키마 쓰기
    if ($data.PSObject.Properties['processId']) {
        $data.processId = $NewPid
    } else {
        $data | Add-Member -NotePropertyName processId -NotePropertyValue $NewPid -Force
    }
    if ($data.PSObject.Properties['last_heartbeat']) {
        $data.last_heartbeat = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
    } else {
        $data | Add-Member -NotePropertyName last_heartbeat -NotePropertyValue (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ') -Force
    }
    try {
        $json = $data | ConvertTo-Json -Depth 8
        Set-Content -Path $MarkerPath -Value $json -Encoding UTF8 -NoNewline
        return $true
    } catch {
        return $false
    }
}

# 격리 검사: 주어진 file_path가 allowed_dirs 중 하나에 속하는가
function Test-PathAllowed {
    param(
        [string]$FilePath,
        [string[]]$AllowedDirs,
        [string]$Role = "worker"
    )
    if (-not $FilePath) { return $true }  # 빈 경로는 패스 (다른 도구가 처리)

    # 절대 경로 정규화
    $abs = if ([System.IO.Path]::IsPathRooted($FilePath)) {
        $FilePath
    } else {
        Join-Path $PWD.Path $FilePath
    }
    $abs = [System.IO.Path]::GetFullPath($abs)

    # CEO 예외: 모든 디렉토리 허용 (단 archive 제외)
    if ($Role -eq "ceo") {
        if ($abs -like "*\.dispatch\archive\*") { return $false }
        return $true
    }

    # allowed_dirs 매칭 — prefix 검사 (디렉토리 단위)
    foreach ($dir in $AllowedDirs) {
        if (-not $dir) { continue }
        $absDir = if ([System.IO.Path]::IsPathRooted($dir)) {
            $dir
        } else {
            Join-Path $PWD.Path $dir
        }
        $absDir = [System.IO.Path]::GetFullPath($absDir).TrimEnd('\','/')
        if ($abs.StartsWith($absDir + '\') -or $abs.StartsWith($absDir + '/') -or $abs -eq $absDir) {
            return $true
        }
    }
    return $false
}

# _registry.jsonl 이벤트 append
# NOTE: pid 키는 자동 변수 $PID 와 ETS 충돌 위험이 있어 processId 로 표기.
function Add-RegistryEvent {
    param(
        [string]$Event,         # "session_start" | "session_end" | "violation" | "heartbeat"
        [hashtable]$Payload,
        [string]$ProjectRoot = $PWD.Path
    )
    $root = Get-DispatchRoot -ProjectRoot $ProjectRoot
    if (-not (Test-Path $root)) { return }
    $file = Join-Path $root "_registry.jsonl"
    $line = [ordered]@{
        ts = Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ'
        processId = $PID
        event = $Event
    }
    if ($Payload) {
        foreach ($k in $Payload.Keys) { $line[$k] = $Payload[$k] }
    }
    $json = ($line | ConvertTo-Json -Compress -Depth 8)
    Add-Content -Path $file -Value $json -Encoding UTF8
}

# 디스패치 라운드 archive 디렉토리 결정
function Get-ArchiveDir {
    param(
        [string]$Round = "Rx",
        [string]$ProjectRoot = $PWD.Path
    )
    $root = Get-DispatchRoot -ProjectRoot $ProjectRoot
    $date = Get-Date -Format 'yyyy-MM-dd'
    $dir = Join-Path $root "archive\$Round-$date"
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    return $dir
}
