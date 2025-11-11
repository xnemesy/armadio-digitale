param(
  [string]$Project = ("$env:GOOGLE_CLOUD_PROJECT"),
  [string]$Function = "analyzeImage",
  [int]$Minutes = 60
)

if (-not $Project) {
  Write-Error "Missing GCP project. Pass -Project or set GOOGLE_CLOUD_PROJECT."
  exit 1
}

$startTime = (Get-Date).AddMinutes(-$Minutes).ToString("o")

Write-Host "Reading logs for last $Minutes minutes..." -ForegroundColor Cyan

# Fetch all logs from the function in time window, filter for cache events locally
# (Avoids complex gcloud filter quoting issues on Windows PowerShell)
$filter = "resource.type=cloud_run_revision AND resource.labels.service_name=$Function AND timestamp>=""$startTime"""

# Get logs in JSON format
$jsonLogs = & gcloud logging read $filter --project=$Project --format=json --limit=2000 2>$null
if (-not $jsonLogs) {
  Write-Host "No logs found in the selected window." -ForegroundColor Yellow
  exit 0
}

$entries = $jsonLogs | ConvertFrom-Json
$hit = 0; $miss = 0; $expired = 0
foreach ($e in $entries) {
  # Read from jsonPayload.cache field
  $cacheEvent = $e.jsonPayload.cache
  
  if ($cacheEvent -eq 'HIT') { $hit++ }
  elseif ($cacheEvent -eq 'MISS') { $miss++ }
  elseif ($cacheEvent -eq 'EXPIRED') { $expired++ }
}

$total = $hit + $miss + $expired
if ($total -eq 0) { $total = 1 }
$hitRate = [math]::Round(($hit / $total) * 100, 2)

Write-Host ("Cache stats (last {0}m): HIT={1} MISS={2} EXPIRED={3} | HitRate={4}%" -f $Minutes, $hit, $miss, $expired, $hitRate) -ForegroundColor Green

# Optional: compute fallback rate by scanning for 'cached":true' in function responses if logged,
# or extend server to log an event when cloud call happens. For now, estimate fallbacks as MISS+EXPIRED.
$fallback = $miss + $expired
Write-Host ("Estimated cloud fallbacks: {0}" -f $fallback) -ForegroundColor Yellow
