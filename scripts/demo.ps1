# One-command DEMO for the customer: prepares data, builds, starts the app and opens a PUBLIC link.
# Run from the project folder (e.g. C:\dev\svoi-test) in Windows PowerShell:
#   .\scripts\demo.ps1 -PixabayKey "YOUR_KEY"
# Options:
#   -SkipUpdate   do not run npm install / db push / SQL migrations / build (already done)
#   -SkipSeed     keep current demo data (admin password is NOT changed then)
#   -NoTunnel     start only on http://localhost:3000 (no public link)
#   -Port 3000    local port
# The public link works while this window stays open. Ctrl+C or Enter stops everything.
# NOTE: console output is ASCII on purpose (Windows console garbles Ukrainian); the customer message is saved to demo-message.txt.
param(
  [string]$PixabayKey = $env:PIXABAY_API_KEY,
  [int]$Port = 3000,
  [switch]$SkipUpdate,
  [switch]$SkipSeed,
  [switch]$NoTunnel,
  [ValidateSet("auto","cloudflared","ssh")][string]$Provider = "auto",   # ssh = localhost.run (no install, no account)
  [string]$DbUser = "postgres",
  [string]$DbName = "svoi",
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432
)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$root = (Get-Location).Path
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

function Step($n, $text) { Write-Host ""; Write-Host "== $n $text ==" -ForegroundColor Cyan }
function Fail($text) { Write-Host "ERROR: $text" -ForegroundColor Red; exit 1 }
function NewPass($prefix) {
  $chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  $rnd = New-Object System.Random
  $tail = -join (1..8 | ForEach-Object { $chars[$rnd.Next($chars.Length)] })
  return "$prefix$tail"
}
function Stop-Tree($proc) {
  if ($proc -and -not $proc.HasExited) { & taskkill /PID $proc.Id /T /F | Out-Null }
}

# ---------- 0. Preflight ----------
Step "0/6" "Preflight"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail "Node.js not found" }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Fail "npm not found" }
if (-not (Test-Path ".env")) { Fail ".env not found in $root (copy it from your old folder)" }
$dbLine = (Get-Content ".env" | Where-Object { $_ -match "^\s*DATABASE_URL\s*=" } | Select-Object -First 1)
if (-not $dbLine) { Fail "DATABASE_URL is missing in .env" }
if ($dbLine -notmatch "localhost|127\.0\.0\.1") { Fail "DATABASE_URL is not a local database - this script resets demo data, so it only works with localhost" }
$busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($busy) { Fail "Port $Port is busy (old 'npm run start' still running?). Close it or use -Port 3001" }
Write-Host "OK: node $(node -v), folder $root"

# ---------- 1. Update + build ----------
if (-not $SkipUpdate) {
  Step "1/6" "Dependencies, tables, SQL migrations, build (local-update.ps1)"
  & "$PSScriptRoot\local-update.ps1" -DbUser $DbUser -DbName $DbName -DbHost $DbHost -DbPort $DbPort
  if ($LASTEXITCODE -ne 0) { Fail "update/build failed - send me the error text above" }
} else {
  Step "1/6" "Skipped (-SkipUpdate). Make sure 'npm run build' was done on the latest code."
  if (-not (Test-Path ".next")) { Fail ".next not found - run without -SkipUpdate" }
}

# ---------- 2. Credentials + demo data ----------
$adminPass = NewPass "Adm-"
$demoPass = NewPass "Demo-"
if (-not $SkipSeed) {
  Step "2/6" "Demo data (people, stories, posts, listings, admin) - takes several minutes"
  $env:ADMIN_PASSWORD = $adminPass
  $env:DEMO_PASSWORD = $demoPass
  if ($PixabayKey) { $env:PIXABAY_API_KEY = $PixabayKey }
  npm run db:seed-projects -- --reset
  if ($LASTEXITCODE -ne 0) { Fail "seed failed - send me the error text above" }
  npx tsx scripts/clean-broken-images.ts
  if ($PixabayKey) {
    Step "2b/6" "Photos for folders and project banners (Pixabay)"
    npx tsx scripts/fill-folder-images.ts
    if ($LASTEXITCODE -ne 0) { Write-Host "Photo fill stopped (rate limit?). The demo still works; run the script again later to add the rest." -ForegroundColor Yellow }
  } else {
    Write-Host "No -PixabayKey: demo will use generated pictures instead of photos." -ForegroundColor Yellow
  }
} else {
  Step "2/6" "Skipped (-SkipSeed). Admin password is unchanged; the demo account keeps its old password."
  $adminPass = "(unchanged - use the one from the previous run)"
  $demoPass = "(unchanged)"
}

# ---------- 3. Start the app ----------
Step "3/6" "Starting the app on port $Port"
$env:PORT = "$Port"
$env:DEMO_MODE = "1"
$env:NODE_ENV = "production"
$app = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run start" -PassThru -WindowStyle Hidden -RedirectStandardOutput "logs\demo-app.log" -RedirectStandardError "logs\demo-app.err.log"
$up = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  try { if ((Invoke-WebRequest "http://localhost:$Port/api/health" -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200) { $up = $true; break } } catch { }
  if ($app.HasExited) { break }
}
if (-not $up) { Stop-Tree $app; Fail "app did not start - see logs\demo-app.err.log" }
Write-Host "OK: app is up on http://localhost:$Port"

# ---------- 4. Smoke test ----------
Step "4/6" "Smoke test of key pages and APIs"
$checks = @("/", "/feed", "/projects", "/auth/login", "/auth/register", "/api/projects", "/api/health", "/robots.txt")
$bad = 0
foreach ($c in $checks) {
  try { $r = Invoke-WebRequest "http://localhost:$Port$c" -UseBasicParsing -TimeoutSec 20; Write-Host ("  {0}  {1}" -f $r.StatusCode, $c) }
  catch { $code = 0; if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }; Write-Host ("  {0}  {1}  <-- PROBLEM" -f $code, $c) -ForegroundColor Red; $bad++ }
}
try {
  $login = Invoke-RestMethod "http://localhost:$Port/api/auth/login" -Method Post -ContentType "application/json" -Body (@{ email = "seed00@svoi.test"; password = $demoPass } | ConvertTo-Json) -TimeoutSec 20
  Write-Host "  login of the demo account: OK"
} catch { if (-not $SkipSeed) { Write-Host "  login of the demo account: FAILED" -ForegroundColor Red; $bad++ } }
if ($bad -gt 0) { Write-Host "$bad check(s) failed - the demo may still open, but send me logs\demo-app.err.log" -ForegroundColor Yellow }

# ---------- 5. Public link ----------
$publicUrl = "http://localhost:$Port"
$tunnel = $null
function Wait-Url($logs, $pattern, $proc, $seconds) {
  for ($i = 0; $i -lt $seconds; $i++) {
    Start-Sleep -Seconds 1
    foreach ($l in $logs) {
      try { if (Test-Path $l) { $m = Select-String -Path $l -Pattern $pattern | Select-Object -First 1; if ($m) { return $m.Matches[0].Value } } } catch { }
    }
    if ($proc.HasExited) { break }
  }
  return $null
}
if (-not $NoTunnel) {
  Step "5/6" "Public link"
  $found = $null
  # --- A. Cloudflare quick tunnel ---
  if ($Provider -in @("auto", "cloudflared")) {
    $cf = (Get-Command cloudflared -ErrorAction SilentlyContinue)
    $cfPath = $null
    if ($cf) { $cfPath = $cf.Source }
    elseif (Test-Path "scripts\.bin\cloudflared.exe") { $cfPath = (Resolve-Path "scripts\.bin\cloudflared.exe").Path }
    else {
      Write-Host "Downloading cloudflared.exe (one time, ~40 MB)..."
      New-Item -ItemType Directory -Force -Path "scripts\.bin" | Out-Null
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
      $cfUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
      if (Get-Command curl.exe -ErrorAction SilentlyContinue) { & curl.exe -L --retry 3 -o "scripts\.bin\cloudflared.exe" $cfUrl }
      else { $ProgressPreference = "SilentlyContinue"; Invoke-WebRequest $cfUrl -OutFile "scripts\.bin\cloudflared.exe" -UseBasicParsing }
      if ((Test-Path "scripts\.bin\cloudflared.exe") -and (Get-Item "scripts\.bin\cloudflared.exe").Length -gt 10MB) { $cfPath = (Resolve-Path "scripts\.bin\cloudflared.exe").Path }
      else { Write-Host "cloudflared download failed" -ForegroundColor Yellow }
    }
    if ($cfPath) {
      Write-Host "Trying Cloudflare tunnel (up to 45 s)..."
      Remove-Item "logs\tunnel.log" -ErrorAction SilentlyContinue
      $tunnel = Start-Process -FilePath $cfPath -ArgumentList "tunnel --no-autoupdate --protocol http2 --url http://localhost:$Port" -PassThru -WindowStyle Hidden -RedirectStandardError "logs\tunnel.log" -RedirectStandardOutput "logs\tunnel.out.log"
      $found = Wait-Url @("logs\tunnel.log") "https://[a-z0-9-]+\.trycloudflare\.com" $tunnel 45
      if (-not $found) { Write-Host "Cloudflare tunnel did not start (see logs\tunnel.log)." -ForegroundColor Yellow; Stop-Tree $tunnel; $tunnel = $null }
    }
  }
  # --- B. localhost.run over plain SSH (Windows 10/11 has ssh.exe; no account, nothing to install) ---
  if (-not $found -and $Provider -in @("auto", "ssh")) {
    if (Get-Command ssh -ErrorAction SilentlyContinue) {
      Write-Host "Trying localhost.run over SSH (up to 45 s)..."
      Remove-Item "logs\ssh-tunnel.log", "logs\ssh-tunnel.err.log" -ErrorAction SilentlyContinue
      $tunnel = Start-Process -FilePath "ssh" -ArgumentList "-o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:localhost:$Port nokey@localhost.run" -PassThru -WindowStyle Hidden -RedirectStandardOutput "logs\ssh-tunnel.log" -RedirectStandardError "logs\ssh-tunnel.err.log"
      $found = Wait-Url @("logs\ssh-tunnel.log", "logs\ssh-tunnel.err.log") "https://[a-z0-9]+\.lhr\.life" $tunnel 45
      if (-not $found) { Write-Host "localhost.run did not start (see logs\ssh-tunnel.log)." -ForegroundColor Yellow; Stop-Tree $tunnel; $tunnel = $null }
    } else { Write-Host "ssh.exe not found (Windows optional feature 'OpenSSH Client')." -ForegroundColor Yellow }
  }
  if (-not $found) {
    Write-Host "No public link could be created from this network. The app keeps running on http://localhost:$Port." -ForegroundColor Red
    Write-Host "Options: use another network / phone hotspot / VPN and run:  .\scripts\demo.ps1 -SkipUpdate -SkipSeed   or put the demo on the VPS (separate subdomain)." -ForegroundColor Yellow
  } else {
    $publicUrl = $found
    $ok = $false
    for ($i = 0; $i -lt 20 -and -not $ok; $i++) { try { if ((Invoke-WebRequest "$publicUrl/api/health" -UseBasicParsing -TimeoutSec 8).StatusCode -eq 200) { $ok = $true } } catch { Start-Sleep -Seconds 2 } }
    if (-not $ok) { Write-Host "Link is created but not answering yet (needs up to a minute) - open it in a moment." -ForegroundColor Yellow }
  }
} else {
  Step "5/6" "Skipped (-NoTunnel)"
}

# ---------- 6. Info for the customer ----------
Step "6/6" "READY"
$ukMsg = @"
Доброго дня! Демо-версія платформи «Свій для своїх»:

$publicUrl

Як подивитися:
1) Натисніть «Увійти» і введіть демо-акаунт: seed00@svoi.test / $demoPass
   (або зареєструйтеся самі — вибір мови, реєстрація й запрошення працюють).
2) Розділ «Проєкти» — 27 напрямів; відкрийте будь-який, а також «Український експортний альянс» (форми, кабінет, переговори).
3) «+» внизу на телефоні — студія: текст, фото, історія, рілс.
4) Меню → QR / запрошення: ваше реферальне посилання і лічильник запрошених.

Це тестова версія з демонстраційними даними та стоковими фото; посилання працює, поки відкрите вікно на моєму комп'ютері.
"@
$info = @"
PUBLIC LINK : $publicUrl
CUSTOMER    : seed00@svoi.test / $demoPass   (regular user, NOT admin)
ADMIN (you) : admin@svoi.local / $adminPass   (do NOT send this to the customer)
Local       : http://localhost:$Port
Logs        : logs\demo-app.err.log, logs\tunnel.log
"@
[IO.File]::WriteAllText((Join-Path $root "demo-info.txt"), $info, (New-Object Text.UTF8Encoding($true)))
[IO.File]::WriteAllText((Join-Path $root "demo-message.txt"), $ukMsg, (New-Object Text.UTF8Encoding($true)))
Write-Host ""
Write-Host $info -ForegroundColor Green
Write-Host ""
Write-Host "Message for the customer (Ukrainian) is saved to demo-message.txt - open it in Notepad and copy." -ForegroundColor Green
Write-Host "Keep this window open. Press Enter here to stop the demo."
try { [void](Read-Host) } finally {
  Write-Host "Stopping..."
  Stop-Tree $tunnel
  Stop-Tree $app
}
