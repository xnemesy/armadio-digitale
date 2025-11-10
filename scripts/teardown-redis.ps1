param(
  [string]$Project = ("$env:GOOGLE_CLOUD_PROJECT"),
  [string]$Region = "europe-west1",
  [string]$Instance = "armadio-redis"
)

Write-Host "Teardown Redis Memorystore instance..." -ForegroundColor Cyan

if (-not $Project) {
  Write-Error "Missing GCP project. Pass -Project or set GOOGLE_CLOUD_PROJECT."
  exit 1
}

# Check gcloud availability
$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloud) {
  Write-Error "gcloud CLI not found. Install Google Cloud SDK and authenticate (gcloud init)."
  exit 1
}

# Set project (idempotent)
& gcloud config set project $Project | Out-Null

# Describe instance to confirm existence
Write-Host "Checking instance '$Instance' in $Region..."
$exists = (& gcloud redis instances describe $Instance --region=$Region --format="value(name)" 2>$null)
if (-not $exists) {
  Write-Host "No Redis instance named '$Instance' found in $Region for project $Project. Nothing to delete." -ForegroundColor Yellow
  exit 0
}

# Confirm deletion
Write-Host "Deleting Redis instance '$Instance' in $Region (project: $Project)..." -ForegroundColor Yellow
& gcloud redis instances delete $Instance --region=$Region --quiet
if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to delete Redis instance. Check permissions and try again."
  exit $LASTEXITCODE
}

Write-Host "✅ Redis instance deleted. Consider removing any related env vars and firewall rules." -ForegroundColor Green
