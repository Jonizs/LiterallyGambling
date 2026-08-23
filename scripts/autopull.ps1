# Auto-puller: watches origin/main and pulls the moment it moves.
# Run it in its own PowerShell window next to the live-server window:
#   powershell -ExecutionPolicy Bypass -File .\scripts\autopull.ps1
# Stop it with Ctrl+C.

param(
  [int]$Every = 10,          # seconds between checks
  [string]$Branch = "main"
)

$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

Write-Host "Auto-pull watching origin/$Branch every $Every s in $repo" -ForegroundColor Cyan
Write-Host "Ctrl+C to stop." -ForegroundColor DarkGray

while ($true) {
  git fetch --quiet origin $Branch 2>$null

  $local  = (git rev-parse HEAD).Trim()
  $remote = (git rev-parse FETCH_HEAD).Trim()

  if ($local -ne $remote) {
    $dirty = git status --porcelain
    if ($dirty) {
      Write-Host "$(Get-Date -Format HH:mm:ss)  new commits upstream, but you have local changes - not pulling." -ForegroundColor Yellow
    } else {
      Write-Host "$(Get-Date -Format HH:mm:ss)  new commits - pulling..." -ForegroundColor Green
      git pull --ff-only origin $Branch
      git --no-pager log --oneline -1
    }
  }

  Start-Sleep -Seconds $Every
}
