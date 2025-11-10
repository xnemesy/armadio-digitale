# Firestore Cache & Threshold Update

## Firestore Image Analysis Cache
We replaced Redis Memorystore with a Firestore collection-based cache to reduce infrastructure cost and complexity.

Collection: `imageAnalysisCache` (override with env var `IMAGE_CACHE_COLLECTION` in Cloud Functions).
Document ID: SHA-256 hash of the Base64 image payload.
Stored fields:
- `data`: Parsed analysis JSON (name, category, color, brand, material, season)
- `createdAt`: Firestore timestamp of creation
- `expiresAt`: Firestore timestamp; document considered valid until this time
- `hits`: Number of cache hits (incremented asynchronously)

TTL Strategy: Application logic checks `expiresAt` before reuse. (Optional) Enable native Firestore TTL on `expiresAt` field in the Firebase Console for automatic deletion.
TTL Duration: 7 days (override by adjusting `IMAGE_CACHE_TTL_MS`).

### Enabling Firestore TTL (optional but recommended)
1. Go to Firestore console > Settings > TTL.
2. Add a TTL policy for field `expiresAt`.
3. Firestore will purge expired docs automatically after ~24h window.

### Advantages
- No Redis instance cost (previous ~7 EUR/month).
- Zero cold-start penalty for Redis connection.
- Observable cache metrics via Firestore hits field.

### Future Enhancements
- Add an index on `expiresAt` for faster TTL sweeps (optional; TTL system manages internally).
- Add pruning script for large collections if necessary.

## On-Device ML Threshold Increase
Confidence threshold raised: `ML_CONFIG.confidenceThreshold` from 0.7 → 0.8 in `src/ml/config.js`.
Purpose: Reduce cloud fallbacks to Gemini for borderline predictions, lowering API spend.

## Redis Teardown Script
Script added: `scripts/teardown-redis.ps1`
Usage (PowerShell):
```
./scripts/teardown-redis.ps1 -Project armadiodigitale -Region europe-west1 -Instance armadio-redis
```
This deletes the old Redis Memorystore instance safely.

## Validation Checklist
- ✅ Deploy updated Cloud Function (`analyzeImage`) after adding Firestore dependency.
- ✅ Ensure service account has Firestore access (roles: `datastore.user` or higher).
- ✅ Monitor function logs for `Firestore Cache HIT/MISS` entries.
- Run teardown script once hits confirm caching works.

## Client-Side Fallback Tracking (Optional Enhancement)

To track on-device vs cloud classification rate on the client:

1. **Add Analytics Event in `src/lib/ai.js`**:
   ```javascript
   import { logEvent } from './analytics';

   export async function classifyImage(imageUri) {
     // ... existing on-device ML logic
     
     if (confidence >= ML_CONFIG.confidenceThreshold) {
       logEvent('ml_classification', { 
         method: 'on_device', 
         confidence,
         category: result.category 
       });
       return result;
     }
     
     // Cloud fallback
     logEvent('ml_classification', { 
       method: 'cloud_gemini', 
       reason: 'low_confidence',
       onDeviceConfidence: confidence 
     });
     return await callCloudFunction(imageUri);
   }
   ```

2. **Monitor in Firebase Analytics Console**:
   - Event: `ml_classification`
   - Parameter: `method` (on_device vs cloud_gemini)
   - Track distribution over time

3. **Adjust Threshold Based on Data**:
   - If cloud fallback rate > 60%, consider lowering threshold to 0.75
   - If < 20%, current 0.8 is optimal

## Rollback Plan
If Firestore cache causes issues, temporarily re-enable Redis by restoring previous logic and ensuring env vars `REDIS_HOST`, `REDIS_PORT` are set. (Package still includes `redis` dependency for quick rollback.)
