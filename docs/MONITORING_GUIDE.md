# Cloud Function Monitoring & Log Queries

## Quick Start

### Monitor Cache Performance (Automated Script)

```powershell
# Run from project root
./scripts/monitor-cache.ps1 -Project armadiodigitale -Function analyzeImage -Minutes 60
```

**Output Example:**
```
Cache stats (last 60m): HIT=45 MISS=12 EXPIRED=3 | HitRate=75.0%
Estimated cloud fallbacks: 15
```

## Manual Log Queries

### 1. Cache Hit/Miss/Expired Events

```powershell
# All cache events (last hour)
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\" AND timestamp>=\"$(Get-Date -Format 'o' ((Get-Date).AddHours(-1)))\"" --project=armadiodigitale --limit=100 --format=json

# Cache HITs only
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\":\"HIT\"" --project=armadiodigitale --limit=50

# Cache MISSes only
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\":\"MISS\"" --project=armadiodigitale --limit=50

# Expired cache entries
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\":\"EXPIRED\"" --project=armadiodigitale --limit=50
```

### 2. Gemini API Calls (Cloud Fallback Rate)

```powershell
# All Gemini API calls (indicates cloud fallback)
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"gemini\":\"CALL\"" --project=armadiodigitale --limit=50

# Count Gemini calls in last 24h
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"gemini\":\"CALL\" AND timestamp>=\"$(Get-Date -Format 'o' ((Get-Date).AddDays(-1)))\"" --project=armadiodigitale --format=json | ConvertFrom-Json | Measure-Object | Select-Object -ExpandProperty Count
```

### 3. Function Performance Metrics

```powershell
# Recent function invocations with timing
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"processingTime\"" --project=armadiodigitale --limit=20 --format=json

# Error logs
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND severity>=ERROR" --project=armadiodigitale --limit=20

# Rate limit events
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"Rate limit exceeded\"" --project=armadiodigitale --limit=10
```

### 4. Firestore Cache Operations

```powershell
# Cache write operations
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\":\"WRITE\"" --project=armadiodigitale --limit=20

# Cache read errors
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\":\"READ_ERROR\"" --project=armadiodigitale --limit=10

# Cache write errors
gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\":\"WRITE_ERROR\"" --project=armadiodigitale --limit=10
```

## Advanced Queries

### Calculate Hit Rate (PowerShell)

```powershell
$logs = gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\" AND timestamp>=\"$((Get-Date).AddHours(-24).ToString('o'))\"" --project=armadiodigitale --format=json 2>$null | ConvertFrom-Json

$hit = ($logs | Where-Object { $_.textPayload -match '"cache":"HIT"' }).Count
$miss = ($logs | Where-Object { $_.textPayload -match '"cache":"MISS"' }).Count
$expired = ($logs | Where-Object { $_.textPayload -match '"cache":"EXPIRED"' }).Count
$total = $hit + $miss + $expired

if ($total -gt 0) {
  $hitRate = [math]::Round(($hit / $total) * 100, 2)
  Write-Host "24h Cache Stats: HIT=$hit MISS=$miss EXPIRED=$expired | HitRate=$hitRate%" -ForegroundColor Green
} else {
  Write-Host "No cache events in last 24h" -ForegroundColor Yellow
}
```

### Compare Cache vs Gemini Calls

```powershell
# This shows if cache is reducing API costs
$cacheHits = (gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\":\"HIT\" AND timestamp>=\"$((Get-Date).AddDays(-1).ToString('o'))\"" --project=armadiodigitale --format=json 2>$null | ConvertFrom-Json).Count

$geminiCalls = (gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"gemini\":\"CALL\" AND timestamp>=\"$((Get-Date).AddDays(-1).ToString('o'))\"" --project=armadiodigitale --format=json 2>$null | ConvertFrom-Json).Count

Write-Host "24h: Cache Hits=$cacheHits | Gemini API Calls=$geminiCalls" -ForegroundColor Cyan
Write-Host "Gemini calls avoided by cache: $cacheHits (cost savings!)" -ForegroundColor Green
```

## Live Monitoring (Tail Logs)

```powershell
# Watch logs in real-time
gcloud logging tail "resource.labels.function_name=\"analyzeImage\"" --project=armadiodigitale

# Watch cache events only
gcloud logging tail "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\"" --project=armadiodigitale
```

## Cloud Console Dashboards

### Create Log-Based Metrics

1. **Navigate to Logging Console**
   - https://console.cloud.google.com/logs/metrics?project=armadiodigitale

2. **Create Metric for Cache Hits**
   - Click "Create Metric"
   - **Name**: `cache_hits`
   - **Filter**:
     ```
     resource.type="cloud_function"
     resource.labels.function_name="analyzeImage"
     textPayload:"cache":"HIT"
     ```
   - **Metric Type**: Counter
   - Save

3. **Repeat for Other Metrics**
   - `cache_misses` (filter: `textPayload:"cache":"MISS"`)
   - `gemini_api_calls` (filter: `textPayload:"gemini":"CALL"`)

4. **View in Metrics Explorer**
   - https://console.cloud.google.com/monitoring/metrics-explorer
   - Select your custom metrics
   - Create charts and alerts

## Key Performance Indicators (KPIs)

### Healthy Cache Performance
- **Hit Rate**: > 40% after first week
- **Miss Rate**: Should stabilize over time
- **Expired Rate**: ~14% (proportional to 7-day TTL)
- **Gemini API Calls**: Should trend downward as cache fills

### Warning Signs
- Hit Rate < 20% after 7 days → Check cache logic or image uniqueness
- High READ_ERROR or WRITE_ERROR → Check Firestore permissions
- Gemini calls not decreasing → Verify cache is being populated

## Cost Monitoring

### Estimate Gemini Cost Savings

```powershell
# Approximate cost per Gemini call (adjust based on model pricing)
$costPerCall = 0.002  # ~$0.002 per image analysis

$cacheHits = (gcloud logging read "resource.labels.function_name=\"analyzeImage\" AND textPayload:\"cache\":\"HIT\" AND timestamp>=\"$((Get-Date).AddDays(-7).ToString('o'))\"" --project=armadiodigitale --format=json 2>$null | ConvertFrom-Json).Count

$savingsWeekly = $cacheHits * $costPerCall
Write-Host "Estimated weekly savings from cache: $$savingsWeekly" -ForegroundColor Green
```

## Troubleshooting

### No Logs Appearing
1. Check function is being called: test with curl or app
2. Verify log viewer permissions
3. Try broader time range: `--limit=500`

### Hit Rate Lower Than Expected
1. Are users uploading unique images each time?
2. Check `imageHash` collision (unlikely with SHA-256)
3. Verify `expiresAt` isn't too short

### High Expired Rate
1. Normal if TTL = 7 days and traffic is consistent
2. Consider increasing TTL to 14 or 30 days if content is stable

## Next Steps

1. ✅ Deploy function (completed)
2. ✅ Enable Firestore TTL (see FIRESTORE_TTL_SETUP.md)
3. 📊 Run `./scripts/monitor-cache.ps1` daily for first week
4. 📈 Create log-based metrics for long-term tracking
5. 💰 Monitor Gemini API usage in billing console

## Related Documentation
- [CACHE_AND_THRESHOLD_UPDATE.md](./CACHE_AND_THRESHOLD_UPDATE.md) - Overview of cache implementation
- [FIRESTORE_TTL_SETUP.md](./FIRESTORE_TTL_SETUP.md) - TTL configuration guide
