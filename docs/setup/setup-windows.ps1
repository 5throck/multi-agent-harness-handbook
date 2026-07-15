# Workshop Setup — Windows
# Usage: .\setup-windows.ps1 [-WSL2] [-WezTerm] [-Docker] [-Force]
# Run PowerShell as Administrator before executing.
param(
    [switch]$WSL2,
    [switch]$WezTerm,
    [switch]$Docker,
    [switch]$Force
)

$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ── TLS 1.2 enforcement (required for irm/Invoke-WebRequest on PS 5.1) ─────
[Net.ServicePointManager]::SecurityProtocol =
    [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

# ── Execution policy guard ────────────────────────────────────────────────────
$currentPolicy = Get-ExecutionPolicy -Scope CurrentUser
if ($currentPolicy -ne 'RemoteSigned' -and $currentPolicy -ne 'Unrestricted') {
    Write-Host "  ⚠️  Execution policy is '$currentPolicy' — changing to 'RemoteSigned'..." -ForegroundColor Yellow
    try {
        Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
        Write-Host "  ✅  Execution policy set to 'RemoteSigned'" -ForegroundColor Green
    } catch {
        Write-Host "  ❌  Failed to set execution policy: $_" -ForegroundColor Red
        Write-Host "     Run manually as Administrator:" -ForegroundColor Yellow
        Write-Host "     Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned" -ForegroundColor Yellow
        exit 1
    }
}

# ── Admin check ───────────────────────────────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole("Administrators")
if (-not $isAdmin) {
    Write-Host "  ⚠️  관리자 권한으로 실행되지 않았습니다." -ForegroundColor Yellow
    Write-Host "     winget, WSL2 등 일부 설치에서 오류가 발생할 수 있습니다." -ForegroundColor Yellow
    Write-Host "     권장: PowerShell을 관리자 권한으로 재실행하세요." -ForegroundColor Yellow
    Write-Host ""
}

# ── Preflight checks ──────────────────────────────────────────────────────────
# Internet
Write-Host "  🔍  Preflight checks..." -ForegroundColor Cyan
try {
    $null = Test-NetConnection -ComputerName 1.1.1.1 -Port 443 -WarningAction SilentlyContinue -ErrorAction Stop
    Write-Host "  ✅  인터넷 연결 정상" -ForegroundColor Green
} catch {
    Write-Host "  ❌  인터넷에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도하세요." -ForegroundColor Red
    exit 1
}

# Disk space (5 GB minimum)
$driveName = $PWD.Drive.Name
$freeSpace = (Get-PSDrive -Name $driveName -ErrorAction SilentlyContinue).Free
if ($freeSpace -and $freeSpace -lt 5368709120) {
    Write-Host ("  ❌  디스크 여유 공간 부족 ({0:N1} GB / 5 GB 필요)" -f ($freeSpace / 1GB)) -ForegroundColor Red
    exit 1
} elseif ($freeSpace) {
    Write-Host ("  ✅  디스크 여유 공간: {0:N1} GB" -f ($freeSpace / 1GB)) -ForegroundColor Green
}

# OS version
$osVersion = [Environment]::OSVersion.Version
$osBuild = (Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion" -ErrorAction SilentlyContinue).CurrentBuild
if ($osBuild -and [int]$osBuild -lt 22000) {
    Write-Host ("  ⚠️  Windows 11 권장. 현재 빌드: $osBuild (Windows 10)" -f $osVersion.Major) -ForegroundColor Yellow
} else {
    Write-Host "  ✅  OS 버전 확인 완료" -ForegroundColor Green
}

# ── Animation helpers ─────────────────────────────────────────────────────────
$SpinChars = [char[]]@(0x280B, 0x2819, 0x2839, 0x2838, 0x283C, 0x2834, 0x2826, 0x2827, 0x2807, 0x280F)
$Errors    = [System.Collections.Generic.List[string]]::new()

function Section($num, $total, $label) {
    $pct    = [math]::Round($num * 100 / $total)
    $width  = 22
    $filled = [math]::Round($width * $pct / 100)
    $bar    = ('█' * $filled) + ('░' * ($width - $filled))
    Write-Host ""
    Write-Host ("[{0}/{1}] {2,-32} [{3}] {4,3}%" -f $num, $total, $label, $bar, $pct) -ForegroundColor Cyan
}

function RunStep($label, [scriptblock]$block) {
    $job = Start-Job -ScriptBlock $block
    $i   = 0
    while ($job.State -eq 'Running') {
        $ch = $SpinChars[$i % $SpinChars.Count]
        Write-Host ("`r  $ch  $label") -NoNewline -ForegroundColor Cyan
        $i++
        Start-Sleep -Milliseconds 80
    }
    $null = Receive-Job $job -Wait -ErrorAction SilentlyContinue
    $ok   = ($job.ChildJobs[0].JobStateInfo.State -eq 'Completed') -and ($job.ChildJobs[0].Error.Count -eq 0)

    if ($ok) {
        Write-Host ("`r✅  $label") -ForegroundColor Green
    } else {
        # Show last 5 error lines for debugging
        $errOutput = $job.ChildJobs[0].Error | ForEach-Object { $_.ToString() } | Select-Object -First 5
        if ($errOutput) {
            foreach ($line in $errOutput) {
                Write-Host "     $line" -ForegroundColor DarkGray
            }
        }
        $stdErr = $job.ChildJobs[0].Error
        if (-not $errOutput -and $stdErr) {
            $stdErrStr = $stdErr | Select-Object -First 1 | ForEach-Object { $_.Exception.Message }
            if ($stdErrStr) { Write-Host "     $stdErrStr" -ForegroundColor DarkGray }
        }
        Write-Host ("`r❌  $label") -ForegroundColor Red
        $Errors.Add($label)
    }
    Remove-Job $job -Force -ErrorAction SilentlyContinue
    return $ok
}

function Installed($cmd) {
    return [bool](Get-Command $cmd -ErrorAction SilentlyContinue)
}

function ShouldInstall($cmd) {
    return (-not (Installed $cmd)) -or $Force
}

function RefreshEnv {
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH", "User")
}

# ── Log setup ────────────────────────────────────────────────────────────────
$LogDir  = "$env:USERPROFILE\workshop-setup-logs"
$LogFile = Join-Path $LogDir "setup-windows-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
try {
    Start-Transcript -Path $LogFile -Append -ErrorAction Stop | Out-Null
    $transcriptStarted = $true
} catch {
    Write-Host "  ⚠️  로그 저장을 시작할 수 없습니다 (trans 실패): $_" -ForegroundColor Yellow
    $transcriptStarted = $false
}

# ── Graceful shutdown on Ctrl+C ──────────────────────────────────────────────
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
} -ErrorAction SilentlyContinue

# ── Header ────────────────────────────────────────────────────────────────────
Clear-Host
Write-Host "  ╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     Workshop Setup — Windows              ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($Force) {
    Write-Host "  🔧  Force mode: all tools will be reinstalled" -ForegroundColor Yellow
    Write-Host ""
}

$TOTAL = 9

try {
# ════════════════════════════════════════════════════════════════════════════════
# MAIN BODY — wrapped in try/finally for graceful shutdown
# ════════════════════════════════════════════════════════════════════════════════

# ── 1. winget ─────────────────────────────────────────────────────────────────
Section 1 $TOTAL "winget"
if (Installed winget) {
    if ($Force) {
        Write-Host "  ℹ️  Checking for upgradable packages..." -ForegroundColor DarkGray
    } else {
        Write-Host "  ℹ️  winget found — checking for upgradable packages..." -ForegroundColor DarkGray
    }
    $rawLines = winget upgrade --accept-source-agreements 2>&1 | Where-Object { $_ -is [string] }

    # 헤더 구분선(-----)으로 컬럼 위치 파악
    $separatorLine = $rawLines | Where-Object { $_ -match '^[-]+\s+[-]+' } | Select-Object -First 1
    $pkgIds = @()
    if ($separatorLine) {
        # Id 컬럼 시작 위치: 첫 번째 공백 블록 끝
        $idStart = $separatorLine -replace '^(\S+\s+).*', '$1' | ForEach-Object { $_.Length }
        $headerLine = $rawLines | Where-Object { $_ -match '^Name\s+Id' } | Select-Object -First 1
        if ($headerLine) {
            $idStart = $headerLine.IndexOf(' Id') + 1
        }
        $dataLines = $rawLines | Where-Object {
            $_ -notmatch '^[-]' -and
            $_ -notmatch '^Name\s' -and
            $_ -notmatch '^\s*$' -and
            $_ -notmatch '^\d+ upgrades?' -and
            $_ -notmatch 'upgrades available'
        }
        foreach ($line in $dataLines) {
            if ($line.Length -gt $idStart) {
                $rest = $line.Substring($idStart).TrimStart()
                $id   = ($rest -split '\s+')[0]
                if ($id -and $id -notmatch '^[-]') { $pkgIds += $id }
            }
        }
    }

    if ($pkgIds.Count -gt 0) {
        Write-Host "  ℹ️  $($pkgIds.Count) package(s) to upgrade:" -ForegroundColor DarkGray
        $pkgIds | ForEach-Object { Write-Host "       · $_" -ForegroundColor DarkGray }
        Write-Host ""
        $succeeded = 0; $failed = @()
        foreach ($id in $pkgIds) {
            Write-Host -NoNewline "  ⬆️   $id ... " -ForegroundColor Cyan
            $result = winget upgrade --id $id --silent --accept-source-agreements --accept-package-agreements 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅" -ForegroundColor Green
                $succeeded++
            } else {
                Write-Host "❌" -ForegroundColor Red
                $failed += $id
                $Errors.Add("Upgrade: $id")
            }
        }
        Write-Host ""
        Write-Host "✅  Upgraded $succeeded / $($pkgIds.Count) package(s)" -ForegroundColor Green
        if ($failed.Count -gt 0) {
            Write-Host "  ⚠️  Failed: $($failed -join ', ')" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅  All packages up to date" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌  winget not found. Install 'App Installer' from the Microsoft Store." -ForegroundColor Red
    exit 1
}

RefreshEnv

# ── 2. PowerShell 7+ ─────────────────────────────────────────────────────────
Section 2 $TOTAL "PowerShell 7+"
$pwshPath = Get-Command pwsh -ErrorAction SilentlyContinue
$pwshVersion = if ($pwshPath) { & pwsh -NoProfile -Command '$PSVersionTable.PSVersion.ToString()' 2>$null } else { $null }
if ($PSVersionTable.PSVersion.Major -ge 7) {
    Write-Host "✅  PowerShell $($PSVersionTable.PSVersion) (already installed)" -ForegroundColor Green
} elseif ((-not $Force) -and $pwshVersion) {
    Write-Host "✅  PowerShell $pwshVersion (already installed — relaunch terminal as pwsh to use it)" -ForegroundColor Green
} else {
    RunStep "Install PowerShell 7+" {
        winget install Microsoft.PowerShell --silent --accept-source-agreements
    }
    RefreshEnv
    Write-Host "  ⚠️  Restart terminal with PowerShell 7 and re-run after install." -ForegroundColor Yellow
}

# ── 3. Terminal apps ──────────────────────────────────────────────────────────
Section 3 $TOTAL "Terminal apps"
if ((-not $Force) -and (Get-AppxPackage -Name Microsoft.WindowsTerminal -ErrorAction SilentlyContinue)) {
    Write-Host "✅  Windows Terminal (already installed)" -ForegroundColor Green
} else {
    RunStep "Install Windows Terminal" {
        winget install Microsoft.WindowsTerminal --silent --accept-source-agreements
    }
}
if ($WezTerm) {
    if ((-not $Force) -and (Installed wezterm)) {
        Write-Host "✅  WezTerm (already installed)" -ForegroundColor Green
    } else {
        RunStep "Install WezTerm" {
            winget install wez.wezterm --silent --accept-source-agreements
        }
    }
}

# ── 4. Git (+ Git Bash) + gh ──────────────────────────────────────────────────
Section 4 $TOTAL "Git + Git Bash + gh"
if ((-not $Force) -and (Installed git)) {
    Write-Host "✅  git $(git --version) (already installed)" -ForegroundColor Green
} else {
    RunStep "Install Git for Windows" {
        winget install Git.Git --silent --accept-source-agreements
    }
    RefreshEnv
}
if ((-not $Force) -and (Installed gh)) {
    Write-Host "✅  gh $(gh --version | Select-Object -First 1) (already installed)" -ForegroundColor Green
} else {
    RunStep "Install GitHub CLI" {
        winget install GitHub.cli --silent --accept-source-agreements
    }
    RefreshEnv
}
if ($WSL2) {
    $wslFeature = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -ErrorAction SilentlyContinue
    if ($wslFeature -and $wslFeature.State -eq 'Enabled' -and -not $Force) {
        Write-Host "✅  WSL2 (already enabled)" -ForegroundColor Green
    } else {
        RunStep "Enable WSL2" { wsl --install }
        Write-Host "  ⚠️  Restart Windows to finish WSL2 setup." -ForegroundColor Yellow
    }
}

# ── 5. Runtime: bun ───────────────────────────────────────────────────────────
Section 5 $TOTAL "Runtime: bun"
$bunBinPath = "$env:USERPROFILE\.bun\bin"

# Detect whether current session is Windows PowerShell 5.1 (not PowerShell 7+)
$isLegacyPS = ($PSVersionTable.PSVersion.Major -lt 7)

if ((-not $Force) -and (Installed bun)) {
    # bun already present — ensure it is up-to-date
    if ($isLegacyPS -or $Force) {
        Write-Host "  ℹ️  Updating bun to latest version..." -ForegroundColor DarkGray
        $updateOk = RunStep "Update bun" { & bun upgrade }
        if (-not $updateOk) {
            Write-Host "  ⚠️  bun update failed — will retry full install" -ForegroundColor Yellow
            $Force = $true  # fall through to full install below
        }
    }
    if ((-not $Force) -and (Installed bun)) {
        Write-Host "✅  bun $(bun --version) (already installed & up-to-date)" -ForegroundColor Green
    }
}
if ((-not (Installed bun)) -or $Force) {
    # Full install: use npm fallback when PS 5.1 cannot download bun.sh/install.ps1
    $bunInstallOk = $false
    try {
        $bunInstallScript = irm bun.sh/install.ps1 -UseBasicParsing -ErrorAction Stop
        Invoke-Expression $bunInstallScript
        $bunInstallOk = $true
    } catch {
        Write-Host "  ⚠️  bun.sh/install.ps1 download failed: $_" -ForegroundColor Yellow
        Write-Host "     Falling back to npm-based install..." -ForegroundColor Yellow
    }
    if (-not $bunInstallOk) {
        # npm fallback: install bun globally via npm
        if (Installed npm) {
            $npmOk = RunStep "Install bun (npm fallback)" { npm install -g bun }
            if ($npmOk) {
                # npm installs bun to the global npm prefix; resolve the actual binary path
                $npmPrefix = & npm prefix -g 2>$null
                if ($npmPrefix -and (Test-Path "$npmPrefix\bun.exe" -ErrorAction SilentlyContinue)) {
                    $bunBinPath = "$npmPrefix"
                }
                $bunInstallOk = $true
            }
        } else {
            Write-Host "  ❌  Neither bun.sh installer nor npm available — cannot install bun" -ForegroundColor Red
            $Errors.Add("Install bun")
        }
    }
    # Permanent PATH registration (User scope)
    $existingUserPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    if ($existingUserPath -notlike "*$bunBinPath*") {
        [System.Environment]::SetEnvironmentVariable("PATH", "$existingUserPath;$bunBinPath", "User")
    }
    RefreshEnv
    # Second pass: if bun binary still not on PATH, try direct PATH merge
    if (-not (Installed bun)) {
        $env:PATH = "$bunBinPath;$env:PATH"
    }
    if (Installed bun) {
        Write-Host "✅  bun $(bun --version) installed" -ForegroundColor Green
    } else {
        Write-Host "❌  bun install failed" -ForegroundColor Red
        $Errors.Add("Install bun")
    }
}

# ── 6. Runtime: python3 ───────────────────────────────────────────────────────
Section 6 $TOTAL "Runtime: python3"
if ((-not $Force) -and (Installed python)) {
    Write-Host "✅  $(python --version) (already installed)" -ForegroundColor Green
} else {
    RunStep "Install Python 3" {
        winget install Python.Python.3.13 --silent --accept-source-agreements
    }
    RefreshEnv
}

# ── 7. Runtime: uv ───────────────────────────────────────────────────────────
Section 7 $TOTAL "Runtime: uv"
if ((-not $Force) -and (Installed uv)) {
    Write-Host "✅  uv $(uv --version) (already installed)" -ForegroundColor Green
} else {
    RunStep "Install uv" {
        winget install --id astral-sh.uv --silent --accept-source-agreements
    }
    RefreshEnv
    if (-not (Installed uv)) {
        RunStep "Install uv (fallback)" {
            irm https://astral.sh/uv/install.ps1 | iex
        }
        RefreshEnv
    }
}

# ── 8. CLI tools ──────────────────────────────────────────────────────────────
Section 8 $TOTAL "CLI tools"
if ((-not $Force) -and (Installed claude)) {
    Write-Host "✅  claude (already installed)" -ForegroundColor Green
} else {
    # On PS 5.1, 'bun install -g' may fail; fall back to npm automatically
    $claudeInstalled = $false
    if (Installed bun) {
        $claudeInstalled = RunStep "Install Claude Code CLI" { bun install -g @anthropic-ai/claude-code }
    }
    if (-not $claudeInstalled) {
        if (-not (Installed bun)) {
            Write-Host "  ⚠️  bun not available — using npm directly" -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠️  bun install failed — falling back to npm" -ForegroundColor Yellow
        }
        $claudeInstalled = RunStep "Install Claude Code CLI (npm fallback)" { npm install -g @anthropic-ai/claude-code }
        RefreshEnv
    }
}
if ((-not $Force) -and (Installed agy)) {
    Write-Host "✅  agy (already installed)" -ForegroundColor Green
} else {
    RunStep "Install Antigravity CLI" {
        irm https://antigravity.google/cli/install.ps1 | iex
    }
    RefreshEnv
}

# ── 9. Desktop apps ───────────────────────────────────────────────────────────
Section 9 $TOTAL "Desktop apps"
if ((-not $Force) -and (Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe")) {
    Write-Host "✅  Google Chrome (already installed)" -ForegroundColor Green
} else {
    RunStep "Install Google Chrome" {
        winget install Google.Chrome --silent --accept-source-agreements
    }
}
if ((-not $Force) -and (Test-Path "$env:LOCALAPPDATA\Programs\Claude\Claude.exe")) {
    Write-Host "✅  Claude Desktop (already installed)" -ForegroundColor Green
} else {
    RunStep "Install Claude Desktop" {
        winget install Anthropic.Claude --silent --accept-source-agreements
    }
}
Write-Host "  ⚠️  Antigravity Desktop — install manually: https://antigravity.google" -ForegroundColor Yellow
Write-Host "  ⚠️  Mark (Markdown viewer) — install manually: https://playloom.app/mark" -ForegroundColor Yellow
if ($Docker) {
    if ((-not $Force) -and (Installed docker)) {
        Write-Host "✅  Docker $(docker --version) (already installed)" -ForegroundColor Green
    } else {
        RunStep "Install Docker Desktop" {
            winget install Docker.DockerDesktop --silent --accept-source-agreements
        }
        Write-Host "  ⚠️  Launch Docker Desktop once to complete setup." -ForegroundColor Yellow
    }
}

# ── Git config check ──────────────────────────────────────────────────────────
$gitName  = git config --global user.name  2>$null
$gitEmail = git config --global user.email 2>$null
if ($gitName -and $gitEmail) {
    Write-Host "✅  git config: $gitName <$gitEmail>" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  git user not configured" -ForegroundColor Yellow
    Write-Host "       git config --global user.name 'Your Name'" -ForegroundColor DarkGray
    Write-Host "       git config --global user.email 'you@example.com'" -ForegroundColor DarkGray
}
$null = gh auth status 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅  gh auth: logged in" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  gh auth: not logged in — run 'gh auth login' before the workshop" -ForegroundColor Yellow
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ══════════════════════════════════════════" -ForegroundColor Cyan
if ($Errors.Count -eq 0) {
    Write-Host "  ✅  All steps complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next → bun setup-common.ts" -ForegroundColor Cyan
} else {
    Write-Host ("  ❌  Failed: " + ($Errors -join ", ")) -ForegroundColor Red
}
Write-Host "  ══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ════════════════════════════════════════════════════════════════════════════════
} finally {
    # Graceful cleanup on Ctrl+C or error
    Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
    if ($transcriptStarted) {
        Stop-Transcript | Out-Null
    }
    Write-Host "  📝  Log saved: $LogFile" -ForegroundColor DarkGray
}
