# Script per eliminare il VPC Access Connector dopo aver rimosso i riferimenti dalle Cloud Functions
param(
  [string]$Project = "armadiodigitale",
  [string]$Region = "europe-west1",
  [string]$Connector = "armadio-connector"
)

Write-Host "Cleanup VPC Access Connector..." -ForegroundColor Cyan
Write-Host ""

if (-not $Project) {
  Write-Error "Missing GCP project. Pass -Project parameter."
  exit 1
}

# Check gcloud availability
$gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloud) {
  Write-Error "gcloud CLI not found. Install Google Cloud SDK."
  exit 1
}

# Set project
& gcloud config set project $Project | Out-Null

Write-Host "Verifica che le Cloud Functions non usino piu il VPC connector..." -ForegroundColor Yellow
Write-Host ""

# Check analyzeImage function
Write-Host "Controllo funzione: analyzeImage"
$analyzeImageVpc = & gcloud run services describe analyzeimage --project=$Project --region=$Region --format="value(spec.template.metadata.annotations['run.googleapis.com/vpc-access-connector'])" 2>$null

if ($analyzeImageVpc) {
  Write-Host "La funzione analyzeImage usa ancora il VPC connector: $analyzeImageVpc" -ForegroundColor Red
  Write-Host "Esegui prima: gcloud functions deploy analyzeImage ... --clear-vpc-connector" -ForegroundColor Yellow
  exit 1
} else {
  Write-Host "analyzeImage: VPC connector rimosso" -ForegroundColor Green
}

# Check getShoppingRecommendations function
Write-Host "Controllo funzione: getShoppingRecommendations"
$shoppingVpc = & gcloud run services describe getshoppingrecommendations --project=$Project --region=$Region --format="value(spec.template.metadata.annotations['run.googleapis.com/vpc-access-connector'])" 2>$null

if ($shoppingVpc) {
  Write-Host "La funzione getShoppingRecommendations usa ancora il VPC connector: $shoppingVpc" -ForegroundColor Red
  Write-Host "Esegui prima: gcloud functions deploy getShoppingRecommendations ... --clear-vpc-connector" -ForegroundColor Yellow
  exit 1
} else {
  Write-Host "getShoppingRecommendations: VPC connector rimosso" -ForegroundColor Green
}

Write-Host ""
Write-Host "Tutte le funzioni hanno rimosso il VPC connector" -ForegroundColor Green
Write-Host ""

# Check if connector exists
Write-Host "Controllo esistenza VPC connector '$Connector'..." -ForegroundColor Yellow
$exists = & gcloud compute networks vpc-access connectors describe $Connector --region=$Region --project=$Project --format="value(name)" 2>$null

if (-not $exists) {
  Write-Host "VPC connector '$Connector' non trovato in $Region. Gia eliminato o mai esistito." -ForegroundColor Yellow
  exit 0
}

Write-Host "Trovato VPC connector: $Connector" -ForegroundColor Cyan
Write-Host ""

# Show connector details
Write-Host "Dettagli VPC connector:" -ForegroundColor Cyan
& gcloud compute networks vpc-access connectors describe $Connector --region=$Region --project=$Project
Write-Host ""

# Confirm deletion
Write-Host "ATTENZIONE: Stai per eliminare il VPC connector '$Connector'" -ForegroundColor Yellow
Write-Host "Questo eliminera il costo fisso di circa 2.49 euro al mese" -ForegroundColor Green
Write-Host ""
$confirmation = Read-Host "Confermi l'eliminazione? (si/no)"

if ($confirmation -ne "si") {
  Write-Host "Operazione annullata dall'utente" -ForegroundColor Yellow
  exit 0
}

Write-Host ""
Write-Host "Eliminazione VPC connector '$Connector' in corso..." -ForegroundColor Yellow
& gcloud compute networks vpc-access connectors delete $Connector --region=$Region --project=$Project --quiet

if ($LASTEXITCODE -ne 0) {
  Write-Error "Errore durante l'eliminazione del VPC connector"
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "VPC connector eliminato con successo!" -ForegroundColor Green
Write-Host ""
Write-Host "Risparmio stimato: circa 2.49 euro al mese" -ForegroundColor Green
Write-Host ""
Write-Host "Prossimi passi:" -ForegroundColor Cyan
Write-Host "   1. Verifica che le Cloud Functions funzionino correttamente"
Write-Host "   2. Monitora i log per eventuali errori"
Write-Host "   3. Considera di rimuovere la dipendenza redis da functions/package.json se non piu necessaria"
Write-Host ""
