# Test the deployed Cloud Function with sample image
$functionUrl = "https://europe-west1-armadiodigitale.cloudfunctions.net/analyzeImage"

# Create a small test image (1x1 red pixel PNG)
$testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

$body = @{
  imageBase64 = $testImageBase64
  mimeType = "image/png"
} | ConvertTo-Json

Write-Host "Testing Cloud Function (First call - should be MISS)..." -ForegroundColor Cyan

try {
  $response1 = Invoke-RestMethod -Method Post -Uri $functionUrl -ContentType 'application/json' -Body $body
  Write-Host "First call successful!" -ForegroundColor Green
  Write-Host "Data: $($response1.data | ConvertTo-Json -Compress)" -ForegroundColor White
  Write-Host "Cached: $($response1.metadata.cached)" -ForegroundColor Yellow
  Write-Host "Processing time: $($response1.metadata.processingTime)ms" -ForegroundColor Yellow
  
  Write-Host "`nTesting Cloud Function (Second call - should be HIT)..." -ForegroundColor Cyan
  Start-Sleep -Seconds 2
  
  $response2 = Invoke-RestMethod -Method Post -Uri $functionUrl -ContentType 'application/json' -Body $body
  Write-Host "Second call successful!" -ForegroundColor Green
  Write-Host "Cached: $($response2.metadata.cached)" -ForegroundColor Yellow
  Write-Host "Processing time: $($response2.metadata.processingTime)ms (should be much faster!)" -ForegroundColor Yellow
  
  if ($response2.metadata.cached -eq $true) {
    Write-Host "`n✅ Cache is working! Second call was served from Firestore." -ForegroundColor Green
  } else {
    Write-Host "`n⚠️ Cache might not be working as expected. Check logs." -ForegroundColor Yellow
  }
  
} catch {
  Write-Host "Error testing function: $_" -ForegroundColor Red
  Write-Host "Check function logs for details:" -ForegroundColor Yellow
  Write-Host "gcloud logging read `"resource.labels.function_name=\`"analyzeImage\`"`" --project=armadiodigitale --limit=20" -ForegroundColor White
}
